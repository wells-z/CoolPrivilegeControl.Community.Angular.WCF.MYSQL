using CoolPrivilegeControlVM;
using CoolPrivilegeControlDAL.Common;
using CoolPrivilegeControlDAL.Respositories;
using CoolPrivilegeControlSerFactory.IService;
using CoolPrivilegeControlVM.EntityVM;
using CoolPrivilegeControlVM.WCFVM;
using CoolPrivilegeControlVM.WCFVM.FunTypeSerVM;
using CoolUtilities.MultiLingual;
using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.Linq;
using System.ServiceModel;
using System.Text;
using System.Threading.Tasks;
using WCF_Infrastructure;
using System.ComponentModel.Composition.Hosting;
using CoolPrivilegeControlVM.WEBVM;
using System.ServiceModel.Web;

namespace CoolPrivilegeControlService
{
    public class FunTypeMgtSer : ServiceBase, IFunTypeMgtSer
    {
        public FunTypeMgtSer()
            : base()
        {

        }

        public FunTypeMgtSer(CompositionContainer Container)
            : base(Container)
        {

        }

        public FTSerListResult GetListWithPaging(WCFAuthInfoVM entity_WCFAuthInfoVM, FunctionTypeVM entity_SearchCriteria, int int_CurrentPage, int int_PageSize, string str_SortColumn, string str_SortDir, List<string> str_CustomFilter)
        {
            try
            {
                //Restore Server Session by token
                RetrieveServerSideSession(entity_WCFAuthInfoVM);

                //Flag Success or Fail
                bool ret = false;

                //Define error list
                List<string> strList_Error = new List<string>();

                //Instantiate  FTSerListResult
                FTSerListResult returnResult = new FTSerListResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                FunctionTypeRespository entityRepos_FT = new FunctionTypeRespository(dbContext, entity_BaseSession.ID);

                #region [ Check Privilege ]
                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);
                #endregion

                bool allowEdit = entity_BaseSession.CheckAccessRight("FTManage", "Edit", "", null);
                bool allowDel = entity_BaseSession.CheckAccessRight("FTManage", "Delete", "", null);

                //Initialize FTSerListResult instance 
                returnResult.StrList_Error = strList_Error;
                returnResult.Int_TotalRecordCount = 0;
                returnResult.EntityList_FunctionTypeVM = new List<FunctionTypeVM>();

                //Success
                if (ret)
                {
                    int recordCount = 0;

                    if (entity_SearchCriteria == null)
                        entity_SearchCriteria = new FunctionTypeVM();

                    if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.FunctionType) && str_CustomFilter.Count == 0)
                    {
                        str_CustomFilter.Add(String.Format("{0}.StartsWith(\"{1}\")", "FT_Name", entity_SearchCriteria.FunctionType));
                    }

                    List<FunctionTypeVM> vmList = entityRepos_FT.GetEntityListByPage(entity_SearchCriteria, int_CurrentPage, int_PageSize, str_SortColumn, str_SortDir, out recordCount, str_CustomFilter, null, null, (entityList_FunTypeVM) =>
                    {
                        foreach (var item in entityList_FunTypeVM)
                        {
                            item.AllowDel = allowDel;
                            item.AllowEdit = allowEdit;
                        }

                        return entityList_FunTypeVM;
                    });

                    //Assign data to FTSerListResult instance 
                    returnResult.EntityList_FunctionTypeVM = vmList;
                    returnResult.Int_TotalRecordCount = recordCount;
                }

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public FTSerEditResult GetEntityByID(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_FTID)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                FTSerEditResult returnResult = new FTSerEditResult();

                //Contruct Login User Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                FunctionTypeRespository Respo_FT = new FunctionTypeRespository(dbContext, entity_BaseSession.ID);

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                bool allowEdit = entity_BaseSession.CheckAccessRight("FTManage", "Edit", "", null);
                bool allowDel = entity_BaseSession.CheckAccessRight("FTManage", "Delete", "", null);

                if (ret)
                {
                    FunctionTypeVM db_FunctionTypeVM = Respo_FT.GetEntityByID(Guid.Parse(str_FTID), languageKey, out strList_Error);

                    db_FunctionTypeVM.AllowDel = allowDel;
                    db_FunctionTypeVM.AllowEdit = allowEdit;

                    returnResult.Entity_FunctionTypeVM = db_FunctionTypeVM;
                }

                returnResult.StrList_Error = strList_Error;

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public WCFReturnResult Create(WCFAuthInfoVM entity_WCFAuthInfoVM, FunctionTypeVM entity_FunTypeVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                //Contruct Login User Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();
                FunctionTypeRespository Respo_FT = new FunctionTypeRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret)
                {
                    ret = Respo_FT.Create(entity_FunTypeVM, languageKey, ref strList_Error);
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

        public WCFReturnResult Delete(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_FTID)
        {
            try
            {
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                //Contruct Login User Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                FunctionTypeRespository Respo_FT = new FunctionTypeRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret)
                {
                    ret = Respo_FT.Delete(str_FTID, languageKey, ref strList_Error);
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

        public WCFReturnResult Update(WCFAuthInfoVM entity_WCFAuthInfoVM, FunctionTypeVM entity_FunTypeVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                //Contruct Login User Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                FunctionTypeRespository Respo_FT = new FunctionTypeRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret)
                {
                    ret = Respo_FT.Update(entity_FunTypeVM, languageKey, ref strList_Error);
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

        public List<FunctionTypeVM> GetAllFunType(WCFAuthInfoVM entity_WCFAuthInfoVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                List<FunctionTypeVM> returnResult = new List<FunctionTypeVM>();

                //Contruct Login User Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                FunctionTypeRespository Respo_FT = new FunctionTypeRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                if (ret)
                {
                    IPrivilegeFun entity_IPrivilegeFun = WCFBootstrapper.Container.GetExportedValue<IPrivilegeFun>();
                    SessionWUserInfo entity_SessionWUserInfo = entity_IPrivilegeFun.getAuthorizedInfoByUserID(entity_BaseSession.ID);

                    entity_BaseSession = entity_SessionWUserInfo;

                    bool allowEdit = entity_BaseSession.CheckAccessRight("FTManage", "Edit", "", null);
                    bool allowDel = entity_BaseSession.CheckAccessRight("FTManage", "Delete", "", null);

                    returnResult = Respo_FT.GetAllFunctionType();

                    foreach (var item in returnResult)
                    {
                        item.AllowEdit = allowEdit;
                        item.AllowDel = allowDel;
                    }
                }

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public FTSerEditResult GetEmptyFTVM(WCFAuthInfoVM entity_WCFAuthInfoVM)
        {
            try
            {
                //Restore Server Session by token
                RetrieveServerSideSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                FTSerEditResult returnResult = new FTSerEditResult();

                bool ret = false;

                ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                if (ret)
                {
                    returnResult.Entity_FunctionTypeVM = new FunctionTypeVM();
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
