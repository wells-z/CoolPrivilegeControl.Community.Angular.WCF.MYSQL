using CoolPrivilegeControlSerFactory.IService;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CoolPrivilegeControlVM.WCFVM;
using WCF_Infrastructure.Policies;
using CoolPrivilegeControlVM.CommonVM;
using CoolPrivilegeControlVM.EntityVM;
using CoolPrivilegeControlDAL.Respositories;
using CoolPrivilegeControlDAL.Common;
using System.ServiceModel;
using CoolDAL.Common;
using System.ComponentModel.Composition;
using WCF_Infrastructure;
using System.ComponentModel.Composition.Hosting;
using CoolPrivilegeControlVM;
using System.ServiceModel.Web;

namespace CoolPrivilegeControlService
{
    public class CheckPrivilegeSer : ServiceBase, ICheckPrivilegeSer
    {
        public CheckPrivilegeSer()
            : base()
        {

        }

        public CheckPrivilegeSer(CompositionContainer Container)
            : base(Container)
        {

        }

        public bool CheckPrivilege(WCFAuthInfoVM entity_WCFAuthInfoVM, bool isCheckFunType)
        {
            try
            {
                bool ret = false;
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                if (!isCheckFunType)
                    ret = CheckAccPrivilege(entity_BaseSession.ID, ref strList_Error);
                else
                    ret = CheckAccPrivilege(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, ref strList_Error);

                return ret;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }


        public bool CheckPrivilegeWithLUserID(WCFAuthInfoVM entity_WCFAuthInfoVM, string str_SpecificUserId, bool includeCurrentUser)
        {
            try
            {
                bool ret = false;
                RetrieveLanguageAndSession(entity_WCFAuthInfoVM);

                List<string> strList_Error = new List<string>();

                ret = CheckAccPrivilegeWSpID(entity_BaseSession.ID, entity_WCFAuthInfoVM.RequestFunKey, entity_WCFAuthInfoVM.RequestFunTypeKey, str_SpecificUserId, includeCurrentUser, ref strList_Error);

                return ret;
            }
            catch (Exception ex)
            {
                throw new WebFaultException<WCFErrorContract>(new WCFErrorContract(ex), System.Net.HttpStatusCode.ExpectationFailed);
            }
        }
    }
}
