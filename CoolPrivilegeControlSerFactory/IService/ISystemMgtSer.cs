using CoolPrivilegeControlVM.CommonVM;
using CoolPrivilegeControlVM.EntityVM;
using CoolPrivilegeControlVM.WCFVM;
using CoolPrivilegeControlVM.WCFVM.SysInfoSerVM;
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
    // NOTE: You can use the "Rename" command on the "Refactor" menu to change the interface name "ISystemMgtSer" in both code and config file together.
    [ServiceContract]
    [CoolWCFBehavior]
    public interface ISystemMgtSer
    {
        [OperationContract]
        [CoolWCFBehavior]
         //[FaultContract(typeof(WCFErrorContract))]
        [WebInvoke(Method = "POST",
            RequestFormat = WebMessageFormat.Json,
            ResponseFormat = WebMessageFormat.Json)]
        SystemInfoVM GetSystemInfo(WCFAuthInfoVM entity_WCFAuthInfoVM);

        [OperationContract]
        [CoolWCFBehavior]
         //[FaultContract(typeof(WCFErrorContract))]
        [WebInvoke(Method = "POST",
            BodyStyle = WebMessageBodyStyle.WrappedRequest,
            RequestFormat = WebMessageFormat.Json,
            ResponseFormat = WebMessageFormat.Json)]
        WCFReturnResult Update(WCFAuthInfoVM entity_WCFAuthInfoVM, SystemInfoVM entity_SysVM);

        [OperationContract]
        [CoolWCFBehavior]
        [WebInvoke(Method = "GET",
            RequestFormat = WebMessageFormat.Json,
            ResponseFormat = WebMessageFormat.Json,
            UriTemplate = "GetMultiLingualResSer/{str_LangKey}")]
        string GetMultiLingualResSer(string str_LangKey);
    }
}
