using CoolPrivilegeControlSerFactory.IService;
using System;
using System.Collections.Generic;
using System.Linq;
using CoolPrivilegeControlVM.EntityVM;
using CoolPrivilegeControlDAL.Common;
using CoolPrivilegeControlVM.WCFVM;
using CoolPrivilegeControlDAL.Respositories;
using System.ServiceModel;
using System.ComponentModel.Composition;
using WCF_Infrastructure;
using CoolPrivilegeControlVM.WCFVM.OrgDetailsSerVM;
using CoolPrivilegeControlVM;
using CoolUtilities.MultiLingual;
using CoolPrivilegeControlModels.Models;
using CoolPrivilegeControlDAL.Policies;
using System.ComponentModel.Composition.Hosting;
using System.ServiceModel.Web;
using CoolPrivilegeControlVM.WEBVM;

namespace CoolPrivilegeControlService
{
    public class OrgDetailMgtSer : ServiceBase, IOrgDetailMgtSer
    {
        public OrgDetailMgtSer()
            : base()
        {

        }

        public OrgDetailMgtSer(CompositionContainer Container)
            : base(Container)
        {

        }

        public List<LUserOrgDetailsVM> GetAll(WCFAuthInfoVM entity_WCFAuthInfoVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                OrgDRespository orgDRespo = new OrgDRespository(dbContext, entity_BaseSession.ID);

                List<LUserOrgDetailsVM> entityList_OrgDetailsVM = new List<LUserOrgDetailsVM>();

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                if (ret)
                {
                    IPrivilegeFun entity_IPrivilegeFun = WCFBootstrapper.Container.GetExportedValue<IPrivilegeFun>();

                    SessionWUserInfo entity_SessionWUserInfo = entity_IPrivilegeFun.getAuthorizedInfoByUserID(entity_BaseSession.ID);

                    entity_BaseSession = entity_SessionWUserInfo;

                    bool allowEdit = entity_BaseSession.CheckAccessRight("LUOrgDetailsManage", "Edit", "", null);
                    bool allowDel = entity_BaseSession.CheckAccessRight("LUOrgDetailsManage", "Delete", "", null);

                    entityList_OrgDetailsVM = orgDRespo.GetLUOrgDVM_All();

                    entityList_OrgDetailsVM.ForEach(current =>
                    {
                        current.AllowDel = allowDel;
                        current.AllowEdit = allowEdit;
                    });
                }

                return entityList_OrgDetailsVM;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public ODSerListResult GetListWithPaging(WCFAuthInfoVM entity_WCFAuthInfoVM, LUserOrgDetailsVM entity_SearchCriteria, int int_CurrentPage, int int_PageSize, string str_SortColumn, string str_SortDir, List<string> str_CustomFilter)
        {
            try
            {
                //Restore Server Session
                RetrieveServerSideSession(entity_WCFAuthInfoVM);

                bool ret_CheckPrivilege = false;

                List<string> strList_Error = new List<string>();

                ODSerListResult returnResult = new ODSerListResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                OrgDRespository entityRepos_OrgD = new OrgDRespository(dbContext, entity_BaseSession.ID);

                #region [ Check Privilege ]
                ret_CheckPrivilege = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);
                #endregion

                bool allowEdit = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Edit", "", null);
                bool allowDel = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Delete", "", null);

                bool allowEdit_Role = entity_BaseSession.CheckAccessRight("LURoleManage", "Edit", "", null);
                bool allowDel_Role = entity_BaseSession.CheckAccessRight("LURoleManage", "Delete", "", null);

                returnResult.StrList_Error = strList_Error;
                returnResult.Int_TotalRecordCount = 0;
                returnResult.EntityList_LUserOrgDetailsVM = new List<LUserOrgDetailsVM>();

                if (ret_CheckPrivilege)
                {
                    int recordCount = 0;

                    if (entity_SearchCriteria == null)
                        entity_SearchCriteria = new LUserOrgDetailsVM();

                    if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.OrgDetailsKey) && str_CustomFilter.Count == 0)
                    {
                        str_CustomFilter.Add(String.Format("{0}.StartsWith(\"{1}\")", "OD_Key", entity_SearchCriteria.OrgDetailsKey));
                    }

                    LUOrgDetailsAccessPolicy lUOrgDetailsAccessPolicy = new LUOrgDetailsAccessPolicy();

                    Func<List<LUserOrgDetails>, List<LUserOrgDetails>> func_OtherFilter = (entityList_OrgDetails) =>
                    {
                        List<LUserOrgDetails> ret = entityList_OrgDetails;
                        if (entity_SearchCriteria.OrgDetailsType.HasValue)
                        {
                            if (entity_SearchCriteria.OrgDetailsType.Value == 1)
                            {
                                ret = ret.Where(current => current.OD_Type.HasValue && current.OD_Type.Value == 1).ToList();
                            }
                            else if (entity_SearchCriteria.OrgDetailsType.Value == 2)
                            {
                                ret = ret.Where(current => current.OD_Type.HasValue && current.OD_Type.Value == 2).ToList();
                                if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.SC_RoleName))
                                {
                                    List<LUserOrgDetailsVM> entityList_LoginUservm = lUOrgDetailsAccessPolicy.Get_OrgDetailsSettings_RoleName(dbContext, entity_SearchCriteria.SC_RoleName.ToString());

                                    var IDList_LoginUserVM = entityList_LoginUservm.Select(current => current.ID).ToList();

                                    ret = ret.Where(current => IDList_LoginUserVM.Contains(current.ID)).ToList();
                                }
                            }
                        }

                        if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.OrgDetailsKey))
                        {
                            string str_OrganizationKey = entity_SearchCriteria.OrgDetailsKey.ToString();
                            ret = ret.Except(ret.Where(current => current.OD_Key.IndexOf(str_OrganizationKey) != 0)).ToList();
                        }
                        return ret;
                    };

                    List<LUserOrgDetailsVM> vmList = entityRepos_OrgD.GetEntityListByPage(entity_SearchCriteria, int_CurrentPage, int_PageSize, str_SortColumn, str_SortDir, out recordCount, str_CustomFilter, func_OtherFilter, null, (entityList_VM) =>
                    {
                        foreach (var item in entityList_VM)
                        {
                            if (item.OrgDetailsType == 2)
                            {
                                List<LUserRoleVM> entityList_RoleVM = lUOrgDetailsAccessPolicy.Get_RoleSettings_OrgDID(item.ID);

                                foreach (var item_Role in entityList_RoleVM)
                                {
                                    item_Role.AllowDel = allowDel_Role;
                                    item_Role.AllowEdit = allowEdit_Role;
                                }

                                item.EntityList_Role = entityList_RoleVM;
                                item.OrgDetailsTypeName = MultilingualHelper.GetStringFromResource(languageKey, "AsRoleSetting");
                            }
                            else if (item.OrgDetailsType == 1)
                            {
                                item.OrgDetailsTypeName = MultilingualHelper.GetStringFromResource(languageKey, "SpecificFunctions");
                            }

                            item.AllowDel = allowDel;
                            item.AllowEdit = allowEdit;
                        }
                        return entityList_VM;
                    });

                    returnResult.EntityList_LUserOrgDetailsVM = vmList;
                    returnResult.Int_TotalRecordCount = recordCount;
                }

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public ODSerEditResult GetEntityByID(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_OrgDetailsID)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                ODSerEditResult returnResult = new ODSerEditResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                OrgDRespository Respo_OD = new OrgDRespository(dbContext, entity_BaseSession.ID);

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                bool allowEdit = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Edit", "", null);
                bool allowDel = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Delete", "", null);

                if (ret)
                {
                    Guid guid_OrgDID = default(Guid);
                    if (Guid.TryParse(str_OrgDetailsID, out guid_OrgDID))
                    {
                        LUserOrgDetailsVM entity_LUserOrgDetailsVM = Respo_OD.GetEntityByID(guid_OrgDID, languageKey, ref strList_Error);

                        entity_LUserOrgDetailsVM.AllowEdit = allowEdit;
                        entity_LUserOrgDetailsVM.AllowDel = allowDel;

                        returnResult.Entity_LUserOrgDetailsVM = entity_LUserOrgDetailsVM;
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

        public WCFReturnResult Create(WCFAuthInfoVM entity_WCFAuthInfoVM, LUserOrgDetailsVM entity_OrgDetailsVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                OrgDRespository entityRepos_OrgD = new OrgDRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret)
                {
                    ret = entityRepos_OrgD.Create(entity_OrgDetailsVM, languageKey, ref strList_Error);
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

        public WCFReturnResult Delete(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_OrgDetailsID)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                OrgDRespository entityRepos_OrgD = new OrgDRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret)
                {
                    ret = entityRepos_OrgD.Delete(str_OrgDetailsID, languageKey, ref strList_Error);
                }
                else
                {
                    ret = false;
                    string str_Message = MultilingualHelper.GetStringFromResource(languageKey, "E012");
                    strList_Error.Add(string.Format(str_Message, "ID"));
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

        public WCFReturnResult Update(WCFAuthInfoVM entity_WCFAuthInfoVM, LUserOrgDetailsVM entity_OrgDetailsVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                OrgDRespository Respo_OrgD = new OrgDRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret)
                {
                    ret = Respo_OrgD.Update(entity_OrgDetailsVM, languageKey, ref strList_Error);
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

        public List<LUserRoleVM> GetRoleSettingsByOrgDID(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_OrgDetailsID)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                LUOrgDetailsAccessPolicy lUOrgDetailsAccessPolicy = new LUOrgDetailsAccessPolicy();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                bool ret = false;

                List<LUserRoleVM> entityList_R = new List<LUserRoleVM>();

                List<string> strList_Error = new List<string>();

                ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                if (ret)
                {
                    Guid guid_OrgDID = default(Guid);
                    if (Guid.TryParse(str_OrgDetailsID, out guid_OrgDID))
                    {
                        entityList_R = lUOrgDetailsAccessPolicy.Get_RoleSettings_OrgDID(guid_OrgDID);
                    }
                }
                return entityList_R;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public List<FunDetailInfo> GetPrivilegeByUserID(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_ID, RoleType enum_RoleType)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                AccPrivilegePolicy userRoleFunDetailsPolicy = new AccPrivilegePolicy();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                bool ret = false;

                List<FunDetailInfo> entityList_FunDetailInfo = new List<FunDetailInfo>();

                List<string> strList_Error = new List<string>();

                ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                if (ret)
                {
                    Guid guid_OrgDID = default(Guid);
                    if (Guid.TryParse(str_ID, out guid_OrgDID))
                    {
                        entityList_FunDetailInfo = userRoleFunDetailsPolicy.Get_LoginUserPrivilege_UserID(dbContext, guid_OrgDID, enum_RoleType);

                        foreach (var item in entityList_FunDetailInfo)
                        {
                            item.FName = MultilingualHelper.GetStringFromResource(languageKey, item.FKey);
                        }
                    }
                }
                return entityList_FunDetailInfo;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public ODSerEditResult GetEmptyOrgDetailVM(WCFAuthInfoVM entity_WCFAuthInfoVM)
        {
            try
            {
                //Restore Server Session by token
                RetrieveServerSideSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                ODSerEditResult returnResult = new ODSerEditResult();

                bool ret = false;

                ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                if (ret)
                {
                    returnResult.Entity_LUserOrgDetailsVM = new LUserOrgDetailsVM();
                    returnResult.Entity_LUserOrgDetailsVM.OrgDetailsTypeName = "";
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
