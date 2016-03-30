/**************************************************************************
*
* NAME        : ICheckPrivilegeSer.cs
*
* VERSION     : 1.0.0
*
* DATE        : 03-Feb-2016
*
* DESCRIPTION : ICheckPrivilegeSer
*
* MODIFICATION HISTORY
* Name             Date         Description
* ===============  ===========  =======================================
* Wells Cheung     03-Feb-2016  Initial Version
*
**************************************************************************/
using CoolPrivilegeControlVM.EntityVM;
using CoolPrivilegeControlVM.WCFVM;
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
    [ServiceContract]
    [CoolWCFBehavior]
    public interface ICheckPrivilegeSer
    {
        [OperationContract]
         //[FaultContract(typeof(WCFErrorContract))]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
           BodyStyle = WebMessageBodyStyle.WrappedRequest,
           RequestFormat = WebMessageFormat.Json,
           ResponseFormat = WebMessageFormat.Json)]
        bool CheckPrivilege(WCFAuthInfoVM entity_WCFAuthInfoVM, bool isCheckFunType);

        [OperationContract]
         //[FaultContract(typeof(WCFErrorContract))]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
           BodyStyle = WebMessageBodyStyle.WrappedRequest,
           RequestFormat = WebMessageFormat.Json,
           ResponseFormat = WebMessageFormat.Json)]
        bool CheckPrivilegeWithLUserID(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_SpecificUserId, bool includeCurrentUser);
    }
}
