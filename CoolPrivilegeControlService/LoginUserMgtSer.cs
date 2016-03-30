using CoolPrivilegeControlDAL.Common;
using CoolPrivilegeControlModels.Models;
using CoolPrivilegeControlDAL.Policies;
using CoolPrivilegeControlDAL.Respositories;
using CoolPrivilegeControlSerFactory.IService;
using CoolPrivilegeControlVM.CommonVM;
using CoolPrivilegeControlVM.EntityVM;
using CoolPrivilegeControlVM.ExportMetadata;
using CoolPrivilegeControlVM.WCFVM;
using CoolUtilities;
using CoolUtilities.MultiLingual;
using System;
using System.Collections.Generic;
using System.ComponentModel.Composition.Hosting;
using System.ComponentModel.Composition.Primitives;
using System.Linq;
using System.ServiceModel;
using WCF_Infrastructure;
using WCF_Infrastructure.Policies;
using System.ComponentModel.Composition;
using CoolPrivilegeControlVM;
using CoolPrivilegeControlVM.WCFVM.LoginUserSerVM;
using CoolDAL.Common;
using CoolPrivilegeControlVM.WEBVM;
using System.ServiceModel.Web;

namespace CoolPrivilegeControlService
{
    public class LoginUserMgtSer : ServiceBase, ILoginUserMgtSer
    {
        public LoginUserMgtSer()
            : base()
        {

        }

        public LoginUserMgtSer(CompositionContainer Container)
            : base(Container)
        {

        }

        public LUSerListResult GetListWithPaging(WCFAuthInfoVM entity_WCFAuthInfoVM, LoginUserVM entity_SearchCriteria, int int_CurrentPage, int int_PageSize, string str_SortColumn, string str_SortDir, List<string> str_CustomFilter, List<Guid> guidList_AccessedLUserID)
        {
            try
            {
                //Restore Server Session
                RetrieveServerSideSession(entity_WCFAuthInfoVM);

                bool ret_CheckPrivilege = false;

                List<string> strList_Error = new List<string>();

                LUSerListResult returnResult = new LUSerListResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();
                LUserAccessPolicy userAccessPolicy = new LUserAccessPolicy();
                LUserAccessByOrgPolicy userAccessByOrgPolicy = new LUserAccessByOrgPolicy();
                LoginUserRespository entityRepos = new LoginUserRespository(dbContext, entity_BaseSession.ID);

                #region [ Check Privilege ]
                ret_CheckPrivilege = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);
                #endregion

                bool allowEdit_Role = entity_BaseSession.CheckAccessRight("LURoleManage", "Edit", "", null);
                bool allowDel_Role = entity_BaseSession.CheckAccessRight("LURoleManage", "Delete", "", null);

                bool allowEdit_Org = entity_BaseSession.CheckAccessRight("LUOrganizationManage", "Edit", "", null);
                bool allowDel_Org = entity_BaseSession.CheckAccessRight("LUOrganizationManage", "Delete", "", null);

                returnResult.StrList_Error = strList_Error;
                returnResult.Int_TotalRecordCount = 0;
                returnResult.EntityList_LoginUserVM = new List<LoginUserVM>();

                if (ret_CheckPrivilege)
                {
                    Func<List<LUser>, List<LUser>> func_OtherFilter = (entityList_LUVM) =>
                    {
                        List<LUser> ret = entityList_LUVM;
                        if (entity_SearchCriteria.UserType.HasValue)
                        {
                            if (entity_SearchCriteria.UserType.Value == 1)
                            {
                                ret = ret.Where(current => current.LU_UserType.HasValue && current.LU_UserType.Value == 1).ToList();
                            }
                            else if (entity_SearchCriteria.UserType.Value == 2)
                            {
                                ret = ret.Where(current => current.LU_UserType.HasValue && current.LU_UserType.Value == 2).ToList();
                                if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.SC_RoleName))
                                {
                                    List<LoginUserVM> entityList_LoginUservm = userAccessPolicy.Get_LoginUser_RoleName(dbContext, entity_SearchCriteria.SC_RoleName.ToString());

                                    var IDList_LoginUserVM = entityList_LoginUservm.Select(current => current.ID).ToList();

                                    ret = ret.Where(current => IDList_LoginUserVM.Contains(current.ID)).ToList();
                                }
                            }
                            else if (entity_SearchCriteria.UserType.Value == 3)
                            {
                                ret = ret.Where(current => current.LU_UserType.HasValue && current.LU_UserType.Value == 3).ToList();
                                if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.SC_OrgKey))
                                {
                                    List<LoginUserVM> entityList_LoginUservm = userAccessByOrgPolicy.Get_LoginUser_OrgName(dbContext, entity_SearchCriteria.SC_OrgKey.ToString());

                                    var IDList_LoginUserVM = entityList_LoginUservm.Select(current => current.ID).ToList();

                                    ret = ret.Where(current => IDList_LoginUserVM.Contains(current.ID)).ToList();
                                }
                            }
                        }

                        if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.LoginName))
                        {
                            ret = ret.Except(ret.Where(current => current.LU_Name.IndexOf(entity_SearchCriteria.LoginName) != 0)).ToList();
                        }

                        //AccessRight Checking
                        ret = ret.Where(current => guidList_AccessedLUserID.Contains(current.ID)).ToList();
                        return ret;
                    };
                    int recordCount = 0;

                    if (entity_SearchCriteria == null)
                        entity_SearchCriteria = new LoginUserVM();

                    if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.LoginName) && str_CustomFilter.Count == 0)
                    {
                        str_CustomFilter.Add(String.Format("{0}.StartsWith(\"{1}\")", "LU_Name", entity_SearchCriteria.LoginName));
                    }

                    List<LoginUserVM> vmList = entityRepos.GetEntityListByPage(entity_SearchCriteria, int_CurrentPage, int_PageSize, str_SortColumn, str_SortDir, out recordCount, str_CustomFilter, func_OtherFilter, null, (entityList_VM) =>
                    {
                        foreach (var item in entityList_VM)
                        {
                            List<LUserRoleVM> entityList_RoleVM = userAccessPolicy.Get_RoleSettings_LUserID(dbContext, item.ID);

                            foreach (var item_Role in entityList_RoleVM)
                            {
                                item_Role.AllowDel = allowDel_Role;
                                item_Role.AllowEdit = allowEdit_Role;
                            }

                            item.EntityList_Role = entityList_RoleVM;

                            List<LUserOrganizationVM> entityList_OrgVM = userAccessByOrgPolicy.Get_OrgSettings_LUserID(dbContext, item.ID);

                            foreach (var item_Org in entityList_OrgVM)
                            {
                                item_Org.AllowDel = allowDel_Org;
                                item_Org.AllowEdit = allowEdit_Org;
                            }

                            item.EntityList_Org = entityList_OrgVM;
                        }
                        return entityList_VM;
                    });

                    IPrivilegeFun entity_IPrivilegeFun = WCFBootstrapper.Container.GetExportedValue<IPrivilegeFun>();

                    SessionWUserInfo entity_SessionWUserInfo = entity_IPrivilegeFun.getAuthorizedInfoByUserID(entity_BaseSession.ID);

                    List<Guid> guidList_SpecificLUID = vmList.Select(current => current.ID).ToList();

                    IDictionary<Guid, bool> boolDic_Del = new Dictionary<Guid, bool>();
                    IDictionary<Guid, bool> boolDic_Eidt = new Dictionary<Guid, bool>();
                    if (StaticContent.LockAdmin())
                    {
                        boolDic_Del = CheckAccPrivilegeWSpecificUserIDList(entity_SessionWUserInfo, entity_WCFAuthInfoVM.RequestFunKey, "Delete", guidList_SpecificLUID);
                        boolDic_Eidt = CheckAccPrivilegeWSpecificUserIDList(entity_SessionWUserInfo, entity_WCFAuthInfoVM.RequestFunKey, "Edit", guidList_SpecificLUID);
                    }
                    else
                    {
                        boolDic_Del = CheckAccPrivilegeWSpecificUserIDList(entity_SessionWUserInfo, entity_WCFAuthInfoVM.RequestFunKey, "Delete", guidList_SpecificLUID, true);
                        boolDic_Eidt = CheckAccPrivilegeWSpecificUserIDList(entity_SessionWUserInfo, entity_WCFAuthInfoVM.RequestFunKey, "Edit", guidList_SpecificLUID, true);
                    }
                    foreach (var vm in vmList)
                    {
                        if (boolDic_Eidt.ContainsKey(vm.ID))
                            vm.AllowEdit = boolDic_Eidt[vm.ID];
                        if (boolDic_Del.ContainsKey(vm.ID))
                            vm.AllowDel = boolDic_Del[vm.ID];
                    }

                    returnResult.EntityList_LoginUserVM = vmList;
                    returnResult.Int_TotalRecordCount = recordCount;
                }
                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public LUSerEditResult GetEntityByID(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_LUID)
        {
            try
            {
                //Restore Server Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                LUSerEditResult returnResult = new LUSerEditResult();

                WCFSesssionPolicy wcfPolicy = new WCFSesssionPolicy();
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();
                LoginUserRespository loginUserRespo = new LoginUserRespository(dbContext, null);

                LoginUserVM db_LoginUserVM = loginUserRespo.GetEntityByID(Guid.Parse(str_LUID), languageKey, ref strList_Error);

                returnResult.StrList_Error = strList_Error;

                returnResult.Entity_LoginUserVM = db_LoginUserVM;

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public LUSerEditResult GetEntityByIDWDetails(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_LUID)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                bool ret_CheckPrivilege = false;

                LUSerEditResult ret = new LUSerEditResult();
                ret.StrList_Error = strList_Error;

                bool allowEdit = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Edit", "", null);
                bool allowDel = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Delete", "", null);

                Guid ID = Guid.Parse(str_LUID);

                ret_CheckPrivilege = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret_CheckPrivilege)
                {
                    string str_Error = "";
                    LoginUserVM db_LoginUserVM = null;

                    DBContextHelper.ExecuteSearchEvent(CoolPrivilegeControlContext.CreateContext(), dbContext =>
                    {
                        LoginUserRespository Respo_LU = new LoginUserRespository(dbContext, entity_BaseSession.ID);
                        db_LoginUserVM = Respo_LU.GetEntityByID(ID, languageKey, ref strList_Error);

                        db_LoginUserVM.AllowEdit = allowEdit;
                        db_LoginUserVM.AllowDel = allowDel;
                    });

                    if (!string.IsNullOrWhiteSpace(str_Error))
                    {
                        ret.StrList_Error.Add(str_Error);
                    }
                    else
                    {
                        db_LoginUserVM.isChangePwd = false;

                        //By Role Settings
                        if (db_LoginUserVM.UserType.HasValue && db_LoginUserVM.UserType.Value == 2)
                        {
                            LUserAccessPolicy lUserAccessPolicy = new LUserAccessPolicy();

                            DBContextHelper.ExecuteSearchEvent(CoolPrivilegeControlContext.CreateContext(), dbContext =>
                            {
                                List<LUserRoleVM> entityList = lUserAccessPolicy.Get_RoleSettings_LUserID(dbContext, ID);

                                if (entityList.Count > 0)
                                {
                                    db_LoginUserVM.roleListIDList = entityList.Select(currrent => currrent.ID.ToString()).Aggregate((first, next) =>
                                    {
                                        return first + "|" + next;
                                    });
                                }
                            });
                        }
                        //By Organization Settings
                        else if (db_LoginUserVM.UserType.HasValue && db_LoginUserVM.UserType.Value == 3)
                        {
                            DBContextHelper.ExecuteSearchEvent(CoolPrivilegeControlContext.CreateContext(), dbContext =>
                            {
                                LUserAccessByOrgRespository entity_LUserAccessByOrgRespo = new LUserAccessByOrgRespository(dbContext, entity_BaseSession.ID);

                                List<LUserAccessByOrgVM> entityList = entity_LUserAccessByOrgRespo.Get_LoginUserOrgSettings_LUserID(dbContext, ID);

                                if (entityList.Count > 0)
                                {
                                    db_LoginUserVM.orgListIDList = entityList.Select(currrent => currrent.UA_Org_ID.ToString()).Aggregate((first, next) =>
                                    {
                                        return first + "|" + next;
                                    });

                                    db_LoginUserVM.orgDetailsIDList = entityList.Select(currrent => currrent.UA_OrgD_ID.ToString()).Aggregate((first, next) =>
                                    {
                                        return first + "|" + next;
                                    });
                                }
                            });
                        }
                        //By Specific Function Settings
                        else
                        {
                            DBContextHelper.ExecuteSearchEvent(CoolPrivilegeControlContext.CreateContext(), dbContext =>
                            {
                                AccPrivilegePolicy userRoleFunDetailsPolicy = new AccPrivilegePolicy();

                                List<FunDetailInfo> entityList_FunDetailInfo = userRoleFunDetailsPolicy.Get_LoginUserPrivilege_UserID(dbContext, ID);

                                foreach (var item in entityList_FunDetailInfo)
                                {
                                    item.FName = MultilingualHelper.GetStringFromResource(languageKey, item.FKey);
                                }

                                db_LoginUserVM.EntityList_FDInfo = entityList_FunDetailInfo;
                            });
                        }
                    }

                    ret.Entity_LoginUserVM = db_LoginUserVM;
                }
                return ret;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public WCFReturnResult Create(WCFAuthInfoVM entity_WCFAuthInfoVM, LoginUserVM entity_LUVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                //Contruct Login User Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();
                LoginUserRespository loginUserRespo = new LoginUserRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret)
                {
                    ret = loginUserRespo.Create(entity_LUVM, languageKey, ref strList_Error);
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

        public WCFReturnResult Update(WCFAuthInfoVM entity_WCFAuthInfoVM, LoginUserVM entity_LUVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                //Contruct Login User Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();
                LoginUserRespository loginUserRespo = new LoginUserRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                if (StaticContent.LockAdmin())
                    ret = CheckAccPrivilegeWSpID(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, entity_LUVM.ID.ToString(), false, ref strList_Error);
                else
                    ret = CheckAccPrivilegeWSpID(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, entity_LUVM.ID.ToString(), true, ref strList_Error);

                if (ret)
                {
                    ret = loginUserRespo.Update(entity_LUVM, languageKey, ref strList_Error);
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

        public WCFReturnResult Delete(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_LUID)
        {
            try
            {
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                //Contruct Login User Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();
                LoginUserRespository loginUserRespo = new LoginUserRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                if (StaticContent.LockAdmin())
                    ret = CheckAccPrivilegeWSpID(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, str_LUID, false, ref strList_Error);
                else
                    ret = CheckAccPrivilegeWSpID(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, str_LUID, true, ref strList_Error);

                if (ret)
                {
                    ret = loginUserRespo.Delete(str_LUID, languageKey, ref strList_Error);
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

        public WCFReturnResult ResetPwd(WCFAuthInfoVM entity_WCFAuthInfoVM, LoginUserVM entity_LUVM)
        {
            try
            {
                //Restore Server Session
                WCFReturnResult returnResult = new WCFReturnResult();
                WCFSesssionPolicy wcfPolicy = new WCFSesssionPolicy();
                BaseSession entity_BaseSession = wcfPolicy.RestoreWCFSesssion(entity_WCFAuthInfoVM);

                //Contruct Login User Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();
                LoginUserRespository loginUserRespo = new LoginUserRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                var ret = loginUserRespo.ResetPwd(entity_LUVM, languageKey, ref strList_Error);

                returnResult.IsSuccess = ret;

                if (strList_Error.Count > 0)
                {
                    foreach (var item in strList_Error)
                        returnResult.StrList_Error.Add(item);
                }

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public LUSerLoginResult Login(LoginUserVM entityInst, string str_Language, string str_IpAdd, string str_HostName)
        {
            try
            {
                LUSerLoginResult returnResult = new LUSerLoginResult();

                SysParmRespository entityRepository = new SysParmRespository();

                StaticContent.SystemInfoInst = entityRepository.RetrieveSystemInfo();

                LanguageKey languageKey_Input = LanguageKey.en;

                Enum.TryParse<LanguageKey>(str_Language, out languageKey_Input);

                // Login Name cannot be empty
                if (string.IsNullOrWhiteSpace(entityInst.LoginName))
                {
                    string str_E001 = MultilingualHelper.GetStringFromResource(languageKey_Input, "E001");
                    str_E001 = string.Format(str_E001, MultilingualHelper.GetStringFromResource(languageKey_Input, "LoginName"));
                    returnResult.StrList_Error.Add(str_E001);
                }

                // Login Password cannot be empty
                if (string.IsNullOrWhiteSpace(entityInst.LoginPwd))
                {
                    string str_E001 = MultilingualHelper.GetStringFromResource(languageKey_Input, "E001");
                    str_E001 = string.Format(str_E001, MultilingualHelper.GetStringFromResource(languageKey_Input, "LoginPwd"));
                    returnResult.StrList_Error.Add(str_E001);
                }

                if (!string.IsNullOrWhiteSpace(entityInst.LoginName) && !string.IsNullOrWhiteSpace(entityInst.LoginPwd))
                {
                    string str_E008 = MultilingualHelper.GetStringFromResource(languageKey_Input, "E008");
                    str_E008 = string.Format(str_E008, MultilingualHelper.GetStringFromResource(languageKey_Input, "LoginName"), MultilingualHelper.GetStringFromResource(languageKey_Input, "LoginPwd"));

                    string str_E009 = MultilingualHelper.GetStringFromResource(languageKey_Input, "E009");

                    string str_E018 = MultilingualHelper.GetStringFromResource(languageKey_Input, "E018");

                    CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();
                    LoginUserRespository loginUserRespo = new LoginUserRespository(dbContext, null);

                    LoginUserVM entityVM_exist = loginUserRespo.GetLoginUserInfo(entityInst.LoginName);
                    if (entityVM_exist != null)
                    {
                        PwdPolicy pwdPolicy = new PwdPolicy();

                        if (!entityVM_exist.Status.HasValue || entityVM_exist.Status.Value == 2)
                        {
                            returnResult.StrList_Error.Add(str_E018);
                        }
                        else if (entityVM_exist.Status.HasValue && entityVM_exist.Status.Value == 3)
                        {
                            returnResult.StrList_Error.Add(str_E018);
                        }
                        else
                        {
                            if (entityVM_exist.LoginPwd == pwdPolicy.GetMD5(entityInst.LoginPwd))
                            {
                                DateTime? dt_LastPwdMDT = entityVM_exist.LastPwdMDT;
                                entityVM_exist.FailCount = 0;
                                entityVM_exist.Status = 1;
                                entityVM_exist.LastLoginDT = DateTime.Now;
                                entityInst.LastPwdMDT = entityVM_exist.LastPwdMDT;
                                List<string> strList_UpdateLastLoginDt_Error = new List<string>();
                                loginUserRespo.UpdateLastLoginDt(entityVM_exist, languageKey_Input, ref strList_UpdateLastLoginDt_Error);
                                if (strList_UpdateLastLoginDt_Error.Count > 0)
                                {
                                    foreach (var item in strList_UpdateLastLoginDt_Error)
                                        returnResult.StrList_Error.Add(item);
                                }
                                else
                                {
                                    AuthorizedHistoryRespository authorityHistoryRespos = new AuthorizedHistoryRespository(dbContext, entityVM_exist.ID);

                                    string str_SaveAuthorizedHistory_Error = "";

                                    //Create Login History
                                    authorityHistoryRespos.Create(new AuthorizedHistoryVM(), languageKey_Input, out str_SaveAuthorizedHistory_Error);

                                    if (!string.IsNullOrWhiteSpace(str_SaveAuthorizedHistory_Error))
                                    {
                                        returnResult.StrList_Error.Add(str_SaveAuthorizedHistory_Error);
                                    }
                                    else
                                    {
                                        string sessionKey = Guid.NewGuid().ToString();
                                        BaseSession entity_BaseSession = new BaseSession();
                                        entity_BaseSession.ID = entityVM_exist.ID;
                                        entity_BaseSession.SessionKey = sessionKey;
                                        entity_BaseSession.IpAddress = str_IpAdd;
                                        entity_BaseSession.LastOperationDt = DateTime.Now;

                                        WCFAuthInfoVM entity_WCFAuthInfoVM = new WCFAuthInfoVM(str_IpAdd, str_HostName, "", "", "", "", "");

                                        WCFSesssionPolicy wcfPolicy = new WCFSesssionPolicy();

                                        wcfPolicy.StoreWCFSession(entity_WCFAuthInfoVM, entity_BaseSession);

                                        #region [ Set Client Authorized Info ]
                                        SessionWUserInfo entity_SessionWUserInfo = loginUserRespo.GetLoginUserAccRight(entity_BaseSession.ID);

                                        if (entity_SessionWUserInfo != null)
                                        {
                                            entity_SessionWUserInfo.SessionKey = Guid.NewGuid().ToString();
                                            entity_SessionWUserInfo.IpAddress = entity_WCFAuthInfoVM.IpAddress;
                                            entity_SessionWUserInfo.LastOperationDt = DateTime.Now;
                                        }
                                        #endregion

                                        returnResult.Entity_SessionWUserInfo = entity_SessionWUserInfo;

                                        if (entityVM_exist.LastPwdMDT.HasValue)
                                        {
                                            returnResult.IsPWDExpire = entityVM_exist.LastPwdMDT.Value.AddDays(((SystemInfoVM)StaticContent.SystemInfoInst).Password_ExpireDays) <= DateTime.Now.Date;
                                        }

                                        returnResult.Str_ServerToken = entity_WCFAuthInfoVM.WCFAuthorizedKey;
                                        returnResult.IsSuccess = true;
                                    }
                                }
                            }
                            else
                            {
                                List<string> strList_UpdateFailCount_Error = new List<string>();
                                loginUserRespo.UpdateFailCount(entityVM_exist, languageKey_Input, ref strList_UpdateFailCount_Error);

                                returnResult.StrList_Error.Add(str_E008);

                                if (strList_UpdateFailCount_Error.Count > 0)
                                {
                                    foreach (var item in strList_UpdateFailCount_Error)
                                        returnResult.StrList_Error.Add(item);
                                }
                            }
                        }
                    }
                    else
                    {
                        returnResult.StrList_Error.Add(str_E008);
                    }
                }
                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public SessionWUserInfo GetAuthInfo(WCFAuthInfoVM entity_WCFAuthInfoVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();
                LoginUserRespository loginUserRespo = new LoginUserRespository(dbContext, null);

                if (entity_BaseSession != null)
                {
                    SessionWUserInfo entity_SessionWUserInfo = loginUserRespo.GetLoginUserAccRight(entity_BaseSession.ID);

                    if (entity_SessionWUserInfo != null)
                    {
                        if (!string.IsNullOrWhiteSpace(entity_WCFAuthInfoVM.WCFClientSessionKey))
                        {
                            entity_SessionWUserInfo.SessionKey = entity_WCFAuthInfoVM.WCFClientSessionKey;
                        }
                        else
                        {
                            entity_SessionWUserInfo.SessionKey = Guid.NewGuid().ToString();
                        }
                        entity_SessionWUserInfo.IpAddress = entity_WCFAuthInfoVM.IpAddress;
                        entity_SessionWUserInfo.LastOperationDt = DateTime.Now;
                    }
                    return entity_SessionWUserInfo;
                }
                return null;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public WCFReturnResult Logout(WCFAuthInfoVM entity_WCFAuthInfoVM)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                string str_SaveAuthorizedHistory_Error = "";
                if (entity_BaseSession != null)
                {
                    CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();
                    AuthorizedHistoryRespository authorityHistoryRespos = new AuthorizedHistoryRespository(dbContext, entity_BaseSession.ID);

                    authorityHistoryRespos.Create(new AuthorizedHistoryVM(), languageKey, out str_SaveAuthorizedHistory_Error, false);

                    wcfPolicy.RemoveWCFSession(entity_BaseSession);
                }
                else
                {
                    str_SaveAuthorizedHistory_Error = MultilingualHelper.GetStringFromResource(languageKey, "E011");
                }

                if (!string.IsNullOrWhiteSpace(str_SaveAuthorizedHistory_Error))
                {
                    returnResult.StrList_Error.Add(str_SaveAuthorizedHistory_Error);
                    returnResult.IsSuccess = false;
                }
                else
                {
                    returnResult.IsSuccess = true;
                }
                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public List<Guid> GetLUIDList(WCFAuthInfoVM entity_WCFAuthInfoVM, List<string> strList_OrgPath)
        {
            List<Guid> lUserList = new List<Guid>();
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                bool ret = false;

                List<string> strList_Error = new List<string>();

                ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                if (ret)
                {
                    if (strList_OrgPath.Count() == 0)
                    {
                        DBContextHelper.ExecuteSearchEvent(CoolPrivilegeControlContext.CreateContext(), dbContext =>
                        {
                            lUserList = dbContext.LUsers.Select(current => current.ID).ToList();
                        });
                    }
                    else
                    {
                        DBContextHelper.ExecuteSearchEvent(CoolPrivilegeControlContext.CreateContext(), dbContext =>
                        {
                            //Filter Under Organization
                            List<LUserOrganization> entityList_LUserOrganization = dbContext.LUserOrganizations.AsNoTracking().Where(current => strList_OrgPath.Where(current1 => current.LUO_Path.IndexOf(current1) == 0 && current.LUO_Path != current1).Count() > 0).ToList();

                            List<Guid> guidList_OrgID = entityList_LUserOrganization.Select(current => current.ID).ToList();

                            var entityList_LUserAccessByOrgs = dbContext.LUserAccessByOrgs.AsNoTracking().ToList().Where(current => guidList_OrgID.Contains(current.UA_Org_ID));

                            List<Guid> guidList = CoolUtilities.CoolLinqUtility.InnerJoin(entityList_LUserAccessByOrgs, dbContext.LUsers.AsNoTracking().ToList(), (left, right) =>
                                left.UA_User_ID == right.ID, (left, right) => right.ID
                            ).ToList();

                            //Add Current User
                            guidList.Add(entity_BaseSession.ID);

                            if (guidList.Count > 0)
                            {
                                lUserList = guidList;
                            }
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
            return lUserList;
        }

        public LoginUserVM GetEmptyLoginUserVM()
        {
            return new LoginUserVM();
        }
    }
}
