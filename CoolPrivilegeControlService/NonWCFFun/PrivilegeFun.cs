using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WCF_Infrastructure;
using CoolPrivilegeControlVM.EntityVM;
using CoolPrivilegeControlDAL.Common;
using CoolPrivilegeControlDAL.Respositories;
using System.ComponentModel.Composition;
using CoolDAL.Common;
using CoolPrivilegeControlVM.WEBVM;

namespace CoolPrivilegeControlService.NonWCFFun
{
    [Export(typeof(IPrivilegeFun))]
    public class PrivilegeFun : IPrivilegeFun
    {
        public SessionWUserInfo getAuthorizedInfoByUserID(Guid guid_UserID)
        {
            CoolPrivilegeControlContext dbContext = CoolPrivilegeControlContext.CreateContext();
            LoginUserRespository Respo_LU = new LoginUserRespository(dbContext, guid_UserID);
            SessionWUserInfo entity_SessionWUserInfo = Respo_LU.GetLoginUserAccRight(guid_UserID);

            return entity_SessionWUserInfo;
        }


        public IList<string> GetOrgPathListBy(Guid guid_UserID)
        {
            IList<string> strList_OrgPath_CheckUser = new List<string>();
            DBContextHelper.ExecuteSearchEvent(CoolPrivilegeControlContext.CreateContext(), dbContext =>
            {
                strList_OrgPath_CheckUser = CoolUtilities.CoolLinqUtility.InnerJoin(
                    dbContext.LUserAccessByOrgs.AsNoTracking().Where(current => current.UA_User_ID == guid_UserID).ToList(),
                    dbContext.LUserOrganizations.AsNoTracking().ToList(),
                    (left, right) => left.UA_Org_ID == right.ID,
                    (left, right) => right).Select(current => current.LUO_Path).ToList();
            });
            return strList_OrgPath_CheckUser;
        }

        public IDictionary<Guid, List<string>> GetOrgPathListByUserIDList(List<Guid> guidList_UserID)
        {
            IDictionary<Guid, List<string>> ret = new Dictionary<Guid, List<string>>();

            foreach (var guid_UserID in guidList_UserID)
            {
                List<string> strList_OrgPath_CheckUser = new List<string>();
                DBContextHelper.ExecuteSearchEvent(CoolPrivilegeControlContext.CreateContext(), dbContext =>
                {
                    strList_OrgPath_CheckUser = CoolUtilities.CoolLinqUtility.InnerJoin(
                        dbContext.LUserAccessByOrgs.AsNoTracking().Where(current => current.UA_User_ID == guid_UserID).ToList(),
                        dbContext.LUserOrganizations.AsNoTracking().ToList(),
                        (left, right) => left.UA_Org_ID == right.ID,
                        (left, right) => right).Select(current => current.LUO_Path).ToList();
                });
                ret[guid_UserID] = strList_OrgPath_CheckUser;
            }
            return ret;
        }
    }
}
