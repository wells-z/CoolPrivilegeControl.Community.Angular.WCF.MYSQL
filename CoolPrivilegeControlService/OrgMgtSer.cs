using CoolPrivilegeControlSerFactory.IService;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CoolPrivilegeControlVM.EntityVM;
using WCF_Infrastructure.Policies;
using CoolPrivilegeControlDAL.Common;
using CoolPrivilegeControlVM.CommonVM;
using CoolPrivilegeControlVM.WCFVM;
using CoolPrivilegeControlDAL.Respositories;
using System.ServiceModel;
using System.ComponentModel.Composition;
using CoolPrivilegeControlVM;
using WCF_Infrastructure;
using CoolUtilities.MultiLingual;
using CoolPrivilegeControlVM.WCFVM.OrgSerVM;
using CoolPrivilegeControlModels.Models;
using CoolDAL.Common;
using CoolPrivilegeControlVM.WEBVM;
using System.ComponentModel.Composition.Hosting;
using System.ServiceModel.Web;

namespace CoolPrivilegeControlService
{
    public class OrgMgtSer : ServiceBase, IOrgMgtSer
    {
        public OrgMgtSer()
            : base()
        {

        }

        public OrgMgtSer(CompositionContainer Container)
            : base(Container)
        {

        }

        public OrgSerListResult GetListWithPaging(WCFAuthInfoVM entity_WCFAuthInfoVM, LUserOrganizationVM entity_SearchCriteria, int int_CurrentPage, int int_PageSize, string str_SortColumn, string str_SortDir, List<string> str_CustomFilter)
        {
            try
            {
                //Restore Server Session
                RetrieveServerSideSession(entity_WCFAuthInfoVM);

                bool ret_CheckPrivilege = false;

                List<string> strList_Error = new List<string>();

                OrgSerListResult returnResult = new OrgSerListResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                LUserOrganizationRespository entityRepos_Org = new LUserOrganizationRespository(dbContext, entity_BaseSession.ID);

                #region [ Check Privilege ]
                ret_CheckPrivilege = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);
                #endregion

                bool allowEdit = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Edit", "", null);
                bool allowDel = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Delete", "", null);

                returnResult.StrList_Error = strList_Error;
                returnResult.Int_TotalRecordCount = 0;
                returnResult.EntityList_LUserOrganizationVM = new List<LUserOrganizationVM>();

                if (ret_CheckPrivilege)
                {
                    int recordCount = 0;

                    if (entity_SearchCriteria == null)
                        entity_SearchCriteria = new LUserOrganizationVM();

                    if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.OrganizationKey) && str_CustomFilter.Count == 0)
                    {
                        str_CustomFilter.Add(String.Format("{0}.StartsWith(\"{1}\")", "LUO_Key", entity_SearchCriteria.OrganizationKey));
                    }

                    if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.OrganizationPath) && str_CustomFilter.Count == 0)
                    {
                        str_CustomFilter.Add(String.Format("{0}.StartsWith(\"{1}\")", "LUO_Path", entity_SearchCriteria.OrganizationPath));
                    }

                    Func<List<LUserOrganization>, List<LUserOrganization>> func_OtherFilter = (entityList_LUVM) =>
                    {
                        List<LUserOrganization> ret = entityList_LUVM;
                        if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.OrganizationPath))
                        {
                            string str_OrganizationPath = entity_SearchCriteria.OrganizationPath.ToString();
                            ret = ret.Except(ret.Where(current => current.LUO_Path.IndexOf(str_OrganizationPath) != 0)).ToList();
                        }

                        if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.OrganizationKey))
                        {
                            string str_OrganizationKey = entity_SearchCriteria.OrganizationKey.ToString();
                            ret = ret.Except(ret.Where(current => current.LUO_Key.IndexOf(str_OrganizationKey) != 0)).ToList();
                        }
                        return ret;
                    };

                    List<LUserOrganizationVM> vmList = entityRepos_Org.GetEntityListByPage(entity_SearchCriteria, int_CurrentPage, int_PageSize, str_SortColumn, str_SortDir, out recordCount, str_CustomFilter, func_OtherFilter, (entityList_VM) =>
                    {
                        List<LUserOrganizationVM> ret = new List<LUserOrganizationVM>();
                        if (!string.IsNullOrWhiteSpace(str_SortColumn))
                        {
                            if (str_SortColumn.ToLower() == "OrganizationPath")
                            {
                                if (str_SortDir.ToLower() == "asc")
                                {
                                    entityRepos_Org.SortFunctionByPath(ret, entityList_VM, "ASC");
                                }
                                else
                                {
                                    entityRepos_Org.SortFunctionByPath(ret, entityList_VM, "Desc");
                                }
                            }
                            else
                            {
                                ret = entityList_VM;
                            }
                        }
                        else
                        {
                            entityRepos_Org.SortFunctionByPath(ret, entityList_VM, "ASC");
                        }
                        return ret;
                    }, (entityList_VM) =>
                    {
                        foreach (var item in entityList_VM)
                        {
                            if (!string.IsNullOrWhiteSpace(MultilingualHelper.GetStringFromResource(languageKey, item.OrganizationKey)))
                                item.OrganizationName = MultilingualHelper.GetStringFromResource(languageKey, item.OrganizationKey);
                            item.AllowDel = allowDel;
                            item.AllowEdit = allowEdit;
                        }
                        return entityList_VM;
                    });

                    returnResult.EntityList_LUserOrganizationVM = vmList;
                    returnResult.Int_TotalRecordCount = recordCount;
                }

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public WCFReturnResult Create(WCFAuthInfoVM entity_WCFAuthInfoVM, LUserOrganizationVM entity_OrgVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                LUserOrganizationRespository entityRepos_Org = new LUserOrganizationRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret)
                {
                    ret = entityRepos_Org.Create(entity_OrgVM, languageKey, ref strList_Error);
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

        public WCFReturnResult Delete(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_OrgID)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                LUserOrganizationRespository entityRepos_Org = new LUserOrganizationRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret)
                {
                    Guid guid_OrgDID = default(Guid);
                    if (Guid.TryParse(str_OrgID, out guid_OrgDID))
                    {
                        ret = entityRepos_Org.Delete(str_OrgID, languageKey, ref strList_Error);
                    }
                    else
                    {
                        ret = false;
                        string str_Message = MultilingualHelper.GetStringFromResource(languageKey, "E012");
                        strList_Error.Add(string.Format(str_Message, "ID"));
                    }
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

        public WCFReturnResult Update(WCFAuthInfoVM entity_WCFAuthInfoVM, LUserOrganizationVM entity_OrgVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                LUserOrganizationRespository entityRepos_Org = new LUserOrganizationRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret)
                {
                    ret = entityRepos_Org.Update(entity_OrgVM, languageKey, ref strList_Error);
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

        public List<LUserOrganizationVM> GetAll(WCFAuthInfoVM entity_WCFAuthInfoVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                LUserOrganizationRespository orgRespo = new LUserOrganizationRespository(dbContext, entity_BaseSession.ID);

                List<LUserOrganizationVM> entityList_OrgVM = new List<LUserOrganizationVM>();

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                if (ret)
                {
                    IPrivilegeFun entity_IPrivilegeFun = WCFBootstrapper.Container.GetExportedValue<IPrivilegeFun>();

                    SessionWUserInfo entity_SessionWUserInfo = entity_IPrivilegeFun.getAuthorizedInfoByUserID(entity_BaseSession.ID);

                    entity_BaseSession = entity_SessionWUserInfo;

                    bool allowEdit = entity_BaseSession.CheckAccessRight("LUOrganizationManage", "Edit", "", null);
                    bool allowDel = entity_BaseSession.CheckAccessRight("LUOrganizationManage", "Delete", "", null);

                    entityList_OrgVM = orgRespo.GetLUOrgVM_All();

                    foreach (var item_OrgVM in entityList_OrgVM)
                    {
                        item_OrgVM.OrganizationName = MultilingualHelper.GetStringFromResource(languageKey, item_OrgVM.OrganizationKey);
                        item_OrgVM.AllowDel = allowDel;
                        item_OrgVM.AllowEdit = allowEdit;
                    }
                }

                return entityList_OrgVM;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }


        public OrgSerEditResult GetEntityByID(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_OrgID)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                OrgSerEditResult returnResult = new OrgSerEditResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                LUserOrganizationRespository Respo_Org = new LUserOrganizationRespository(dbContext, entity_BaseSession.ID);

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                bool allowEdit = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Edit", "", null);
                bool allowDel = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Delete", "", null);

                if (ret)
                {
                    Guid guid_OrgDID = default(Guid);
                    if (Guid.TryParse(str_OrgID, out guid_OrgDID))
                    {
                        LUserOrganizationVM db_OrgVM = Respo_Org.GetEntityByID(guid_OrgDID, languageKey, ref strList_Error);

                        db_OrgVM.AllowEdit = allowEdit;
                        db_OrgVM.AllowDel = allowDel;

                        returnResult.Entity_LUserOrganizationVM = db_OrgVM;
                    }
                    else
                    {
                        ret = false;
                        string str_Message = MultilingualHelper.GetStringFromResource(languageKey, "E012");
                        strList_Error.Add(string.Format(str_Message, "ID"));
                    }
                }

                returnResult.StrList_Error = strList_Error;

                return returnResult;

            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }


        public List<LUserAccessByOrgVM> GetEntityListByIDList_LUserAccessByOrgVM(WCFAuthInfoVM entity_WCFAuthInfoVM, List<string> strList_OrgID, List<string> strList_OrgDetailsID)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                bool ret_CheckPrivilege = false;

                List<LUserAccessByOrgVM> ret = new List<LUserAccessByOrgVM>();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                LoginUserRespository entityRepos_LoginUser = new LoginUserRespository(dbContext, entity_BaseSession.ID);

                SessionWUserInfo entity_SessionWUserInfo = entityRepos_LoginUser.GetLoginUserAccRight(entity_BaseSession.ID);

                string str_E025 = MultilingualHelper.GetStringFromResource(languageKey, "E025");
                if (entity_SessionWUserInfo == null)
                {
                    if (!ret_CheckPrivilege)
                        strList_Error.Add(str_E025);
                }

                if (strList_Error.Count == 0)
                {
                    LUserOrganizationRespository orgRespo = new LUserOrganizationRespository(dbContext, entity_BaseSession.ID);

                    OrgDRespository orgDetailsRespo = new OrgDRespository(dbContext, entity_BaseSession.ID);

                    for (int i = 0; i < strList_OrgID.Count; ++i)
                    {
                        LUserOrganizationVM entity_LUserOrgVM = orgRespo.GetLUOrgVM_ID(strList_OrgID[i]);

                        LUserOrgDetailsVM entity_LUserOrgDetailsVM = orgDetailsRespo.GetLUOrgDVM_ID(strList_OrgDetailsID[i]);

                        if (entity_LUserOrgVM != null && entity_LUserOrgDetailsVM != null)
                        {
                            LUserAccessByOrgVM entity_LUserAccessByOrgVM = new LUserAccessByOrgVM();

                            entity_LUserAccessByOrgVM.UA_Org_ID = Guid.Parse(strList_OrgID[i]);
                            entity_LUserAccessByOrgVM.UA_OrgD_ID = Guid.Parse(strList_OrgDetailsID[i]);

                            entity_LUserAccessByOrgVM.Entity_OrgVM = entity_LUserOrgVM;

                            entity_LUserAccessByOrgVM.OrganizationKey = entity_LUserOrgVM.OrganizationKey;
                            entity_LUserAccessByOrgVM.OrganizationName = MultilingualHelper.GetStringFromResource(languageKey, entity_LUserAccessByOrgVM.OrganizationKey);

                            if (entity_LUserOrgDetailsVM != null)
                            {
                                entity_LUserAccessByOrgVM.Entity_OrgDVM = entity_LUserOrgDetailsVM;

                                entity_LUserAccessByOrgVM.OrgDetailsKey = entity_LUserOrgDetailsVM.OrgDetailsKey;
                                entity_LUserAccessByOrgVM.OrgDetailsType = entity_LUserOrgDetailsVM.OrgDetailsType;

                                if (entity_LUserOrgDetailsVM.OrgDetailsType.HasValue)
                                {
                                    if (entity_LUserOrgDetailsVM.OrgDetailsType.Value == 1)
                                        entity_LUserAccessByOrgVM.OrgDetailsTypeName = MultilingualHelper.GetStringFromResource(languageKey, "SpecificFunctions");
                                    else if (entity_LUserOrgDetailsVM.OrgDetailsType.Value == 2)
                                        entity_LUserAccessByOrgVM.OrgDetailsTypeName = MultilingualHelper.GetStringFromResource(languageKey, "AsRoleSetting");
                                }
                            }
                            ret.Add(entity_LUserAccessByOrgVM);
                        }
                    }
                }
                return ret;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public List<string> GetOrgPathListByLUID(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_UserID)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                List<string> strList_OrgPath_CheckUser = new List<string>();

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                if (ret)
                {
                    DBContextHelper.ExecuteSearchEvent(CoolPrivilegeControlContext.CreateContext(), dbContext =>
                    {
                        strList_OrgPath_CheckUser = CoolUtilities.CoolLinqUtility.InnerJoin(
                            dbContext.LUserAccessByOrgs.AsNoTracking().Where(current => current.UA_User_ID.ToString() == str_UserID).ToList(),
                            dbContext.LUserOrganizations.AsNoTracking().ToList(),
                            (left, right) => left.UA_Org_ID == right.ID,
                            (left, right) => right).Select(current => current.LUO_Path).ToList();
                    });
                }

                return strList_OrgPath_CheckUser;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public OrgSerEditResult GetEmptyOrgVM(WCFAuthInfoVM entity_WCFAuthInfoVM)
        {
            try
            {
                //Restore Server Session by token
                RetrieveServerSideSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                OrgSerEditResult returnResult = new OrgSerEditResult();

                bool ret = false;

                ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                if (ret)
                {
                    returnResult.Entity_LUserOrganizationVM = new LUserOrganizationVM();
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
