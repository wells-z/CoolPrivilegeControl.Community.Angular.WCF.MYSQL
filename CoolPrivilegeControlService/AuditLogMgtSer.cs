using CoolPrivilegeControlVM;
using CoolPrivilegeControlDAL.Common;
using CoolPrivilegeControlModels.Models;
using CoolPrivilegeControlDAL.Respositories;
using CoolPrivilegeControlSerFactory.IService;
using CoolPrivilegeControlVM.EntityVM;
using CoolPrivilegeControlVM.WCFVM;
using CoolPrivilegeControlVM.WCFVM.AuditLogSerVM;
using CoolUtilities;
using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.Linq;
using System.ServiceModel;
using System.Text;
using System.Threading.Tasks;
using WCF_Infrastructure;
using System.ComponentModel.Composition.Hosting;
using System.ServiceModel.Web;

namespace CoolPrivilegeControlService
{
    public class AuditLogMgtSer : ServiceBase, IAuditLogMgtSer
    {
        public AuditLogMgtSer()
            : base()
        {

        }

        public AuditLogMgtSer(CompositionContainer Container)
            : base(Container)
        {

        }

        public ALSerListResult GetListWithPaging(WCFAuthInfoVM entity_WCFAuthInfoVM, AuditLogVM entity_SearchCriteria, int int_CurrentPage, int int_PageSize, string str_SortColumn, string str_SortDir, List<string> str_CustomFilter)
        {
            try
            {
                //Restore Server Session
                RetrieveServerSideSession(entity_WCFAuthInfoVM);

                bool ret = false;

                List<string> strList_Error = new List<string>();

                ALSerListResult returnResult = new ALSerListResult();

                CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();

                AuditLogRespository entityRepos_AL = new AuditLogRespository(dbContext, entity_BaseSession.ID);

                #region [ Check Privilege ]
                ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);
                #endregion

                returnResult.StrList_Error = strList_Error;
                returnResult.Int_TotalRecordCount = 0;
                returnResult.EntityList_AuditLogVM = new List<AuditLogVM>();

                LoginUserRespository LoginUserRespo = new LoginUserRespository(dbContext, entity_BaseSession.ID);

                List<LoginUserVM> entityList_LUVM = LoginUserRespo.GetLoginUser_All();

                IDictionary<string, Guid> dic_LoginUser = new Dictionary<string, Guid>();
                IDictionary<Guid, string> dic_LoginUser_Reversal = new Dictionary<Guid, string>();

                foreach (var item in entityList_LUVM)
                {
                    dic_LoginUser[item.LoginName] = item.ID;
                    dic_LoginUser_Reversal[item.ID] = item.LoginName;
                }

                if (ret)
                {
                    int recordCount = 0;

                    Func<List<AuditLog>, List<AuditLog>> func_OtherFilter = (entityList_AuditLog) =>
                    {
                        List<AuditLog> temp = entityList_AuditLog;
                        if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.Operator))
                        {
                            List<string> strList_Key = dic_LoginUser.Keys.Where(current => current.ToUpper().StartsWith(entity_SearchCriteria.Operator.ToUpper())).ToList();
                            List<Guid> guidList_Key = new List<Guid>();
                            foreach (var item in strList_Key)
                            {
                                guidList_Key.Add(dic_LoginUser[item]);
                            }

                            if (guidList_Key.Count > 0)
                            {
                                temp = temp.Where(current => guidList_Key.Contains(current.AL_UserID)).ToList();
                            }
                            else
                            {
                                temp.Clear();
                            }
                        }

                        if (!string.IsNullOrWhiteSpace(entity_SearchCriteria.AL_EventType))
                        {
                            if ("Create".ToUpper().StartsWith(entity_SearchCriteria.AL_EventType.ToUpper()))
                            {
                                temp = temp.Where(current => current.AL_EventType == OperationType.A.ToString()).ToList();
                            }
                            else if ("Edit".ToUpper().StartsWith(entity_SearchCriteria.AL_EventType.ToUpper()))
                            {
                                temp = temp.Where(current => current.AL_EventType == OperationType.M.ToString()).ToList();
                            }
                            else if ("Delete".ToUpper().StartsWith(entity_SearchCriteria.AL_EventType.ToUpper()))
                            {
                                temp = temp.Where(current => current.AL_EventType == OperationType.D.ToString()).ToList();
                            }
                            else
                            {
                                temp.Clear();
                            }
                        }

                        temp = temp.Where(current => DateTimeUtility.ValidateInputDatetime(current.AL_CreateDate, entity_SearchCriteria.DateFrom, entity_SearchCriteria.DateTo)).ToList();
                        return temp;
                    };

                    List<AuditLogVM> vmList = entityRepos_AL.GetEntityListByPage(entity_SearchCriteria, int_CurrentPage, int_PageSize, str_SortColumn, str_SortDir, out recordCount, str_CustomFilter, func_OtherFilter , (entityList_VM) =>
                    {
                        foreach (var item in entityList_VM)
                        {
                            if (dic_LoginUser_Reversal.ContainsKey(item.AL_UserID))
                                item.Operator = dic_LoginUser_Reversal[item.AL_UserID];
                            if (item.AL_EventType == OperationType.A.ToString())
                            {
                                item.AL_EventType = "Create";
                            }
                            else if (item.AL_EventType == OperationType.M.ToString())
                            {
                                item.AL_EventType = "Edit";
                            }
                            else if (item.AL_EventType == OperationType.D.ToString())
                            {
                                item.AL_EventType = "Delete";
                            }
                        }
                        return entityList_VM;
                    });

                    returnResult.EntityList_AuditLogVM = vmList;
                    returnResult.Int_TotalRecordCount = recordCount;
                }

                return returnResult;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }

        public ALSerEditResult GetEmptyAuditLogVM(WCFAuthInfoVM entity_WCFAuthInfoVM)
        {
            try
            {
                //Restore Server Session by token
                RetrieveServerSideSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                ALSerEditResult returnResult = new ALSerEditResult();

                bool ret = false;

                ret = CheckTokenOnly(entity_BaseSession, ref strList_Error);

                if (ret)
                {
                    returnResult.Entity_AuditLogVM = new AuditLogVM();
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
