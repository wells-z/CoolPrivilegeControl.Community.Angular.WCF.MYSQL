/**************************************************************************
*
* NAME        : IAuditLogMgtSer.cs
*
* VERSION     : 1.0.0
*
* DATE        : 03-Feb-2016
*
* DESCRIPTION : IAuditLogMgtSer
*
* MODIFICATION HISTORY
* Name             Date         Description
* ===============  ===========  =======================================
* Wells Cheung     03-Feb-2016  Initial Version
*
**************************************************************************/
using CoolPrivilegeControlVM.EntityVM;
using CoolPrivilegeControlVM.WCFVM;
using CoolPrivilegeControlVM.WCFVM.AuditLogSerVM;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.ServiceModel;
using System.ServiceModel.Web;
using System.Text;
using WCF_Infrastructure.UnityIntegration;

namespace CoolPrivilegeControlSerFactory.IService
{
    // NOTE: You can use the "Rename" command on the "Refactor" menu to change the interface name "IAuditLogMgtSer" in both code and config file together.
    [ServiceContract]
    [CoolWCFBehavior]
    public interface IAuditLogMgtSer
    {
        [OperationContract]
        // //[FaultContract(typeof(WCFErrorContract))]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
          BodyStyle = WebMessageBodyStyle.WrappedRequest,
          RequestFormat = WebMessageFormat.Json,
          ResponseFormat = WebMessageFormat.Json)]
        ALSerListResult GetListWithPaging(WCFAuthInfoVM entity_WCFAuthInfoVM, AuditLogVM entity_SearchCriteria, int int_CurrentPage, int int_PageSize, string str_SortColumn, string str_SortDir, List<string> str_CustomFilter);

        [OperationContract]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
            RequestFormat = WebMessageFormat.Json,
            ResponseFormat = WebMessageFormat.Json)]
        ALSerEditResult GetEmptyAuditLogVM(WCFAuthInfoVM entity_WCFAuthInfoVM);
    }
}
