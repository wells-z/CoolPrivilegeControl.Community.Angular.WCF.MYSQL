/**************************************************************************
*
* NAME        : IFunMgtSer.cs
*
* VERSION     : 1.0.0
*
* DATE        : 03-Feb-2016
*
* DESCRIPTION : IFunMgtSer
*
* MODIFICATION HISTORY
* Name             Date         Description
* ===============  ===========  =======================================
* Wells Cheung     03-Feb-2016  Initial Version
*
**************************************************************************/
using CoolPrivilegeControlVM.EntityVM;
using CoolPrivilegeControlVM.WCFVM;
using CoolPrivilegeControlVM.WCFVM.FunSerVM;
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
    public interface IFunMgtSer
    {
        [OperationContract]
         //[FaultContract(typeof(WCFErrorContract))]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
           BodyStyle = WebMessageBodyStyle.WrappedRequest,
           RequestFormat = WebMessageFormat.Json,
           ResponseFormat = WebMessageFormat.Json)]
        FSerListResult GetListWithPaging(WCFAuthInfoVM entity_WCFAuthInfoVM, FunctionVM entity_SearchCriteria, int int_CurrentPage, int int_PageSize, string str_SortColumn, string str_SortDir, List<string> str_CustomFilter);

        [OperationContract]
         //[FaultContract(typeof(WCFErrorContract))]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
           BodyStyle = WebMessageBodyStyle.WrappedRequest,
           RequestFormat = WebMessageFormat.Json,
           ResponseFormat = WebMessageFormat.Json)]
        FSerEditResult GetEntityByID(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_FunID);

        [OperationContract]
         //[FaultContract(typeof(WCFErrorContract))]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
           BodyStyle = WebMessageBodyStyle.WrappedRequest,
           RequestFormat = WebMessageFormat.Json,
           ResponseFormat = WebMessageFormat.Json)]
        WCFReturnResult Create(WCFAuthInfoVM entity_WCFAuthInfoVM, FunctionVM entity_FunVM);

        [OperationContract]
         //[FaultContract(typeof(WCFErrorContract))]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
           BodyStyle = WebMessageBodyStyle.WrappedRequest,
           RequestFormat = WebMessageFormat.Json,
           ResponseFormat = WebMessageFormat.Json)]
        WCFReturnResult Delete(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_FunID);

        [OperationContract]
         //[FaultContract(typeof(WCFErrorContract))]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
           BodyStyle = WebMessageBodyStyle.WrappedRequest,
           RequestFormat = WebMessageFormat.Json,
           ResponseFormat = WebMessageFormat.Json)]
        WCFReturnResult Update(WCFAuthInfoVM entity_WCFAuthInfoVM, FunctionVM entity_FunVM);

        [OperationContract]
         //[FaultContract(typeof(WCFErrorContract))]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
           RequestFormat = WebMessageFormat.Json,
           ResponseFormat = WebMessageFormat.Json)]
        List<FunctionVM> GetAll(WCFAuthInfoVM entity_WCFAuthInfoVM);

        [OperationContract]
         //[FaultContract(typeof(WCFErrorContract))]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
           BodyStyle = WebMessageBodyStyle.WrappedRequest,
           RequestFormat = WebMessageFormat.Json,
           ResponseFormat = WebMessageFormat.Json)]
        List<FunctionVM> GetParentFunctions(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_FunKey);

        [OperationContract]
         //[FaultContract(typeof(WCFErrorContract))]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
           BodyStyle = WebMessageBodyStyle.WrappedRequest,
           RequestFormat = WebMessageFormat.Json,
           ResponseFormat = WebMessageFormat.Json)]
        FunDetailInfo GetFunDetailInfo_FID(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_FunID);

        [OperationContract]
         //[FaultContract(typeof(WCFErrorContract))]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
           RequestFormat = WebMessageFormat.Json,
           ResponseFormat = WebMessageFormat.Json)]
        FSerFDListResult GetAllFunWFunType();


        [OperationContract]
         //[FaultContract(typeof(WCFErrorContract))]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
           RequestFormat = WebMessageFormat.Json,
           ResponseFormat = WebMessageFormat.Json)]
        FSerMenusResult GetMenuByAuthInfo(WCFAuthInfoVM entity_WCFAuthInfoVM);

        [OperationContract]
        [CoolWCFBehavior]
        [WebInvoke(Method = "POST",
            RequestFormat = WebMessageFormat.Json,
            ResponseFormat = WebMessageFormat.Json)]
        FSerEditResult GetEmptyFVM(WCFAuthInfoVM entity_WCFAuthInfoVM);
    }
}
