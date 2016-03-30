using CoolPrivilegeControlVM;
using CoolPrivilegeControlDAL.Common;
using CoolPrivilegeControlDAL.Policies;
using CoolPrivilegeControlDAL.Respositories;
using CoolPrivilegeControlSerFactory.IService;
using CoolPrivilegeControlVM.CommonVM;
using CoolPrivilegeControlVM.EntityVM;
using CoolPrivilegeControlVM.WCFVM;
using CoolUtilities.MultiLingual;
using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.Linq;
using System.ServiceModel;
using System.Text;
using System.Threading.Tasks;
using WCF_Infrastructure;
using WCF_Infrastructure.Policies;
using CoolPrivilegeControlVM.WCFVM.FunSerVM;
using CoolPrivilegeControlVM.WEBVM;
using System.ComponentModel.Composition.Hosting;
using System.Web.Script.Serialization;
using System.ServiceModel.Web;

namespace CoolPrivilegeControlService
{
    public class FunMgtSer : ServiceBase, IFunMgtSer
    {
        public FunMgtSer()
            : base()
        {

        }

        public FunMgtSer(CompositionContainer Container)
            : base(Container)
        {

        }

        public List<FunctionVM> GetAll(WCFAuthInfoVM entity_WCFAuthInfoVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                if (entity_BaseSession != null)
                {
                    CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                    FunctionRespository funRespo = new FunctionRespository(dbContext, entity_BaseSession.ID);

                    List<FunctionVM> entityList_OrgVM = new List<FunctionVM>();

                    List<string> strList_Error = new List<string>();

                    bool ret = false;

                    ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                    if (ret)
                    {
                        IPrivilegeFun entity_IPrivilegeFun = WCFBootstrapper.Container.GetExportedValue<IPrivilegeFun>();

                        SessionWUserInfo entity_SessionWUserInfo = entity_IPrivilegeFun.getAuthorizedInfoByUserID(entity_BaseSession.ID);

                        entity_BaseSession = entity_SessionWUserInfo;

                        bool allowEdit = entity_BaseSession.CheckAccessRight("FManage", "Edit", "", null);
                        bool allowDel = entity_BaseSession.CheckAccessRight("FManage", "Delete", "", null);

                        entityList_OrgVM = funRespo.GetFuns_All();

                        entityList_OrgVM.ForEach(current =>
                            {
                                current.FunctionName = MultilingualHelper.GetStringFromResource(languageKey, current.FunctionKey);
                                current.AllowDel = allowDel;
                                current.AllowEdit = allowEdit;
                            });
                    }

                    return entityList_OrgVM;
                }
                return new List<FunctionVM>();
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public FunDetailInfo GetFunDetailInfo_FID(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_FunID)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                bool ret_CheckPrivilege = false;

                List<LUserAccessByOrgVM> ret = new List<LUserAccessByOrgVM>();

                //Contruct Login User Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                LoginUserRespository entityRepos_LoginUser = new LoginUserRespository(dbContext, entity_BaseSession.ID);

                SessionWUserInfo entity_SessionWUserInfo = entityRepos_LoginUser.GetLoginUserAccRight(entity_BaseSession.ID);

                string str_E025 = MultilingualHelper.GetStringFromResource(languageKey, "E025");
                if (entity_SessionWUserInfo == null)
                {
                    if (!ret_CheckPrivilege)
                        strList_Error.Add(str_E025);
                }

                FunDetailInfo entity_FunDetailInfo = null;

                if (strList_Error.Count == 0)
                {
                    FunctionDetailPolicy functionDetailPolicy = new FunctionDetailPolicy();
                    entity_FunDetailInfo = functionDetailPolicy.GetFunDetailInfo_FID(dbContext, Guid.Parse(str_FunID));

                    entity_FunDetailInfo.FName = MultilingualHelper.GetStringFromResource(languageKey, entity_FunDetailInfo.FKey);
                }
                return entity_FunDetailInfo;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public FSerListResult GetListWithPaging(WCFAuthInfoVM entity_WCFAuthInfoVM, FunctionVM entity_SearchCriteria, int int_CurrentPage, int int_PageSize, string str_SortColumn, string str_SortDir, List<string> str_CustomFilter)
        {
            try
            {
                //Restore Server Session
                RetrieveServerSideSession(entity_WCFAuthInfoVM);

                bool ret_CheckPrivilege = false;

                List<string> strList_Error = new List<string>();

                FSerListResult returnResult = new FSerListResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                FunctionRespository entityRepos_F = new FunctionRespository(dbContext, entity_BaseSession.ID);

                #region [ Check Privilege ]
                ret_CheckPrivilege = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);
                #endregion

                bool allowEdit = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Edit", "", null);
                bool allowDel = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Delete", "", null);

                returnResult.StrList_Error = strList_Error;
                returnResult.Int_TotalRecordCount = 0;
                returnResult.EntityList_FunctionVM = new List<FunctionVM>();

                if (ret_CheckPrivilege)
                {
                    int recordCount = 0;

                    if (entity_SearchCriteria == null)
                        entity_SearchCriteria = new FunctionVM();

                    if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.FunctionPath) && str_CustomFilter.Count == 0)
                    {
                        str_CustomFilter.Add(String.Format("{0}.StartsWith(\"{1}\")", "F_Path", entity_SearchCriteria.FunctionPath));
                    }

                    if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.FunctionPath) && str_CustomFilter.Count == 0)
                    {
                        str_CustomFilter.Add(String.Format("{0}.StartsWith(\"{1}\")", "F_Key", entity_SearchCriteria.FunctionKey));
                    }

                    List<FunctionVM> vmList = entityRepos_F.GetEntityListByPage(entity_SearchCriteria, int_CurrentPage, int_PageSize, str_SortColumn, str_SortDir, out recordCount, str_CustomFilter, (entityList) =>
                    {
                        if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.FunctionName))
                        {
                            entityList = entityList.Where(current => MultilingualHelper.GetStringFromResource(languageKey, current.F_Key).ToUpper().StartsWith(entity_SearchCriteria.FunctionName.ToUpper())).ToList();
                        }
                        return entityList;
                    }, (entityList_VM) =>
                    {
                        List<FunctionVM> ret = new List<FunctionVM>();
                        if (!string.IsNullOrWhiteSpace(str_SortColumn))
                        {
                            if (str_SortColumn.ToLower() == "functionpath")
                            {
                                if (str_SortDir.ToLower() == "asc")
                                {
                                    entityRepos_F.SortFunctionByPath(ret, entityList_VM, "ASC");
                                }
                                else
                                {
                                    entityRepos_F.SortFunctionByPath(ret, entityList_VM, "Desc");
                                }
                            }
                            else
                            {
                                ret = entityList_VM;
                            }
                        }
                        else
                        {
                            entityRepos_F.SortFunctionByPath(ret, entityList_VM, "ASC");
                        }
                        return ret;
                    }, (entityList_VM) =>
                    {
                        foreach (var item in entityList_VM)
                        {
                            if (!string.IsNullOrWhiteSpace(MultilingualHelper.GetStringFromResource(languageKey, item.FunctionKey)))
                                item.FunctionName = MultilingualHelper.GetStringFromResource(languageKey, item.FunctionKey);
                            item.AllowDel = allowDel;
                            item.AllowEdit = allowEdit;
                        }
                        return entityList_VM;
                    });

                    returnResult.EntityList_FunctionVM = vmList;
                    returnResult.Int_TotalRecordCount = recordCount;
                }

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public FSerEditResult GetEntityByID(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_FunID)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                FSerEditResult returnResult = new FSerEditResult();

                //Contruct Login User Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                FunctionRespository Respo_F = new FunctionRespository(dbContext, entity_BaseSession.ID);

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                bool allowEdit = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Edit", "", null);
                bool allowDel = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Delete", "", null);


                if (ret)
                {
                    FunctionVM db_FunctionVM = Respo_F.GetEntityByID(Guid.Parse(str_FunID), languageKey, ref strList_Error);

                    db_FunctionVM.AllowEdit = allowEdit;
                    db_FunctionVM.AllowDel = allowDel;

                    returnResult.Entity_FunctionVM = db_FunctionVM;
                }

                returnResult.StrList_Error = strList_Error;

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public WCFReturnResult Create(WCFAuthInfoVM entity_WCFAuthInfoVM, FunctionVM entity_FunVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);



                WCFReturnResult returnResult = new WCFReturnResult();

                //Contruct Function Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                FunctionRespository Respo_F = new FunctionRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret)
                {
                    ret = Respo_F.Create(entity_FunVM, languageKey, ref strList_Error);
                }

                returnResult.IsSuccess = ret;

                returnResult.StrList_Error = strList_Error;

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public WCFReturnResult Delete(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_FunID)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);



                WCFReturnResult returnResult = new WCFReturnResult();

                //Contruct Login User Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                FunctionRespository Respo_F = new FunctionRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret)
                {
                    ret = Respo_F.Delete(str_FunID, languageKey, ref strList_Error);
                }

                returnResult.IsSuccess = ret;

                returnResult.StrList_Error = strList_Error;

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public WCFReturnResult Update(WCFAuthInfoVM entity_WCFAuthInfoVM, FunctionVM entity_FunVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);



                WCFReturnResult returnResult = new WCFReturnResult();

                //Contruct Login User Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                FunctionRespository Respo_F = new FunctionRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret)
                {
                    ret = Respo_F.Update(entity_FunVM, languageKey, ref strList_Error);
                }

                returnResult.IsSuccess = ret;

                returnResult.StrList_Error = strList_Error;

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public List<FunctionVM> GetParentFunctions(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_FunKey)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);
                List<FunctionVM> entityList_Fun = new List<FunctionVM>();

                if (entity_BaseSession != null)
                {
                    //Contruct Login User Respository
                    CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                    FunctionRespository Respo_F = new FunctionRespository(dbContext, entity_BaseSession.ID);

                    List<string> strList_Error = new List<string>();

                    bool ret = false;

                    ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                    if (ret)
                    {
                        entityList_Fun = Respo_F.GetParents(str_FunKey);
                    }
                }

                return entityList_Fun;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public FSerFDListResult GetAllFunWFunType()
        {
            try
            {
                //Retrieve Language And Session
                //RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                //bool ret_CheckPrivilege = false;

                FSerFDListResult ret = new FSerFDListResult();

                List<FunDetailInfo> entityList_FunDetailInfo = new List<FunDetailInfo>();

                //ret_CheckPrivilege = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                //Contruct Function Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                if (strList_Error.Count == 0)
                {
                    FunctionDetailPolicy functionDetailPolicy = new FunctionDetailPolicy();
                    entityList_FunDetailInfo = functionDetailPolicy.GetFunDetailInfoList(dbContext);
                }

                ret.EntityList_FunDetailInfo = entityList_FunDetailInfo;
                ret.StrList_Error = strList_Error;

                return ret;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public FSerMenusResult GetMenuByAuthInfo(WCFAuthInfoVM entity_WCFAuthInfoVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                bool ret_CheckPrivilege = false;

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                FSerMenusResult ret = new FSerMenusResult();

                ret_CheckPrivilege = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                ret.StrList_Error = strList_Error;

                if (ret_CheckPrivilege)
                {
                    FunctionRespository funRespo = new FunctionRespository(dbContext, entity_BaseSession.ID);

                    List<FunctionVM> entityList_FunVM = funRespo.GetFuns_All();

                    LoginUserRespository loginUserRespo = new LoginUserRespository(dbContext, null);

                    SessionWUserInfo entity_SessionWUserInfo = loginUserRespo.GetLoginUserAccRight(entity_BaseSession.ID);

                    List<Guid> entityList_FId = entity_SessionWUserInfo.EntityList_FDInfo.Select(current => current.FID).ToList();

                    List<MenuItem> entityList_MenuItem = funRespo.GetMenuItems(entityList_FunVM, entityList_FId, languageKey);

                    List<MenuItem> outputMenu = new List<MenuItem>();

                    if (entityList_MenuItem.Count > 0)
                    {
                        outputMenu = funRespo.ConverToHierarchyFormat(entityList_MenuItem);
                    }

                    ret.Json_MenuItems = outputMenu;
                }

                return ret;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public FSerEditResult GetEmptyFVM(WCFAuthInfoVM entity_WCFAuthInfoVM)
        {
            try
            {
                //Restore Server Session by token
                RetrieveServerSideSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                FSerEditResult returnResult = new FSerEditResult();

                bool ret = false;

                ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                if (ret)
                {
                    returnResult.Entity_FunctionVM = new FunctionVM();
                }

                returnResult.StrList_Error = strList_Error;

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }
    }
}