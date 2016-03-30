using CoolPrivilegeControlDAL.Common;
using CoolPrivilegeControlDAL.Respositories;
using CoolPrivilegeControlSerFactory.IService;
using CoolPrivilegeControlVM.CommonVM;
using CoolPrivilegeControlVM.EntityVM;
using CoolPrivilegeControlVM.WCFVM;
using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.Linq;
using System.ServiceModel;
using System.Text;
using System.Threading.Tasks;
using WCF_Infrastructure;
using WCF_Infrastructure.Policies;
using CoolPrivilegeControlVM.WCFVM.AuthorizedMgtSerVM;
using CoolPrivilegeControlVM;
using CoolPrivilegeControlModels.Models;
using CoolDAL.Common;
using CoolUtilities.MultiLingual;
using System.ComponentModel.Composition.Hosting;
using System.ServiceModel.Web;

namespace CoolPrivilegeControlService
{
    public class AuthHisMgtSer : ServiceBase, IAuthHisMgtSer
    {
        public AuthHisMgtSer()
            : base()
        {

        }

        public AuthHisMgtSer(CompositionContainer Container)
            : base(Container)
        {

        }

        public int GetTotalAuthorizationCount(WCFAuthInfoVM entity_WCFAuthInfoVM)
        {
            try
            {
                WCFSesssionPolicy wcfPolicy = new WCFSesssionPolicy();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                BaseSession entity_BaseSession = wcfPolicy.RestoreWCFSesssion(entity_WCFAuthInfoVM);

                AuthorizedHistoryRespository authorizedHistoryRespo = new AuthorizedHistoryRespository(dbContext, entity_BaseSession.ID);
                int int_Counter = authorizedHistoryRespo.GetTotalAuthorizationCount(OperationType.L);

                return int_Counter;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        AHSerListResult IAuthHisMgtSer.GetListWithPaging(WCFAuthInfoVM entity_WCFAuthInfoVM, AuthorizedHistoryVM entity_SearchCriteria, int int_CurrentPage, int int_PageSize, string str_SortColumn, string str_SortDir, List<string> str_CustomFilter)
        {
            try
            {
                //Restore Server Session
                RetrieveServerSideSession(entity_WCFAuthInfoVM);

                bool ret = false;

                List<string> strList_Error = new List<string>();

                AHSerListResult returnResult = new AHSerListResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                AuthorizedHistoryRespository entityRepos_AH = new AuthorizedHistoryRespository(dbContext, entity_BaseSession.ID);

                #region [ Check Privilege ]
                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);
                #endregion

                bool allowDel = entity_BaseSession.CheckAccessRight(entity_WCFAuthInfoVM.RequestFunKey, "Delete", "", null);

                returnResult.StrList_Error = strList_Error;
                returnResult.Int_TotalRecordCount = 0;
                returnResult.EntityList_AuthorizedHistoryVM = new List<AuthorizedHistoryVM>();

                if (ret)
                {
                    int recordCount = 0;

                    List<AuthorizedHistoryVM> vmList = entityRepos_AH.GetEntityListByPage(entity_SearchCriteria, int_CurrentPage, int_PageSize, str_SortColumn, str_SortDir, out recordCount, str_CustomFilter, (entityList) =>
                    {
                        List<AuthorizedHistory> entityList_AuthorizedHistory = new List<AuthorizedHistory>();

                        if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.LoginName))
                        {
                            DBContextHelper.ExecuteSearchEvent(CoolPrivilegeControlContext.CreateContext(), dbContext_Temp =>
                            {
                                List<LUser> entityList_LUser = dbContext_Temp.LUsers.Where(current => current.LU_Name.IndexOf(entity_SearchCriteria.LoginName) == 0).ToList();
                                if (entityList_LUser != null && entityList_LUser.Count > 0)
                                {
                                    List<Guid> guidList_UserID = entityList_LUser.Select(current => current.ID).ToList();

                                    entityList_AuthorizedHistory = entityList.Where(current => guidList_UserID.Contains(current.AH_UserID) && (!string.IsNullOrWhiteSpace(entity_SearchCriteria.OperationType) ? current.AH_EventType == entity_SearchCriteria.OperationType : true)).ToList();
                                }
                            });
                        }
                        else
                        {
                            DBContextHelper.ExecuteSearchEvent(CoolPrivilegeControlContext.CreateContext(), dbContext_Temp =>
                            {
                                entityList_AuthorizedHistory = entityList.Where(current => !string.IsNullOrWhiteSpace(entity_SearchCriteria.OperationType) ? current.AH_EventType == entity_SearchCriteria.OperationType : true).ToList();
                            });
                        }
                        return entityList_AuthorizedHistory;
                    }, null, (entityList) =>
                    {
                        List<Guid> userIDList = entityList.Select(current => current.LoginUserID).ToList();

                        List<LUser> entityList_LUser_GetLoginName = new List<LUser>();

                        DBContextHelper.ExecuteSearchEvent(CoolPrivilegeControlContext.CreateContext(), dbContext_Temp =>
                        {
                            entityList_LUser_GetLoginName = dbContext_Temp.LUsers.Where(current => userIDList.Contains(current.ID)).ToList();
                        });

                        foreach (var item in entityList)
                        {
                            var item_LUser = entityList_LUser_GetLoginName.Where(current => current.ID == item.LoginUserID).FirstOrDefault();
                            if (item_LUser != null)
                            {
                                item.LoginName = item_LUser.LU_Name;
                            }

                            if (item.OperationType == OperationType.L.ToString())
                            {
                                item.OperationTypeName = MultilingualHelper.GetStringFromResource(languageKey, "Login");
                            }
                            else if (item.OperationType == OperationType.O.ToString())
                            {
                                item.OperationTypeName = MultilingualHelper.GetStringFromResource(languageKey, "Logout");
                            }

                            item.AllowDel = allowDel;
                        }
                        return entityList;
                    });

                    returnResult.EntityList_AuthorizedHistoryVM = vmList;
                    returnResult.Int_TotalRecordCount = recordCount;
                }

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }


        public WCFReturnResult Delete(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_AuthHisID)
        {
            try
            {
                //Retrieve Language And Session
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                WCFReturnResult returnResult = new WCFReturnResult();

                //Contruct Login User Respository
                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                AuthorizedHistoryRespository entityRepos_AH = new AuthorizedHistoryRespository(dbContext, entity_BaseSession.ID);

                List<string> strList_Error = new List<string>();

                bool ret = false;

                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                if (ret)
                {
                    ret = entityRepos_AH.Delete(str_AuthHisID, languageKey, ref strList_Error);
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

        public AHSerEditResult GetEmptyAuthHisVM(WCFAuthInfoVM entity_WCFAuthInfoVM)
        {
            try
            {
                //Restore Server Session by token
                RetrieveServerSideSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                AHSerEditResult returnResult = new AHSerEditResult();

                bool ret = false;

                ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                if (ret)
                {
                    returnResult.Entity_AuthHisVM = new AuthorizedHistoryVM();
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
