/// <reference path="../Scripts/angular.js" />
/// <reference path="../Models/StaticContentModel.js" />
/// <reference path="../Scripts/angular-route.js" />

(function () {
    'use strict';

    angular.module("WCFClient", ['ui.router']);

    angular.module("CoolPrivilegeModel", []);

    angular.module("commonUtilities", ['ngCookies', 'ui.router', 'WCFClient', 'CoolPrivilegeModel']);

    angular.module("ValidationModule", ['ngCookies']);

    //angular.module("HomeModule", ['ui.router', 'ngAnimate']);

    angular.module("MainModule", ['ui.router', 'ngSanitize', 'ngAnimate', 'ngStorage', 'commonUtilities', 'CoolPrivilegeModel', 'ngCookies']);

    angular.module("LoginModule", ['ui.router', 'ngAnimate', 'ngResource', 'ngCookies', 'ngStorage', 'commonUtilities', 'ValidationModule', 'WCFClient', 'CoolPrivilegeModel']);

    var CoolPrivilegeControl = angular.module("CoolPrivilegeControl", ['ui.router', 'ngCookies', 'ngStorage', 'commonUtilities', 'MainModule', 'LoginModule', 'WCFClient', 'CoolPrivilegeModel']);

    var injectParams_Config = ['$stateProvider', '$urlRouterProvider', '$locationProvider'];

    var config_Home = function ($stateProvider, $urlRouterProvider, $locationProvider) {

        $locationProvider.html5Mode(true).hashPrefix('!');

        $urlRouterProvider.otherwise("/");

        $stateProvider
            .state('CPCS', {
                url: '/',
                resolve: {
                    Setup: ['$q', '$state', '$location', '$cookies', 'StaticContentModel', 'SystemInfoVM', 'WCFAuthInfoVM', 'SystemInfoRestfulSer', '$sessionStorage', 'MsgBoxModel', function ($q, $state, $location, $cookies, StaticContentModel, SystemInfoVM, WCFAuthInfoVM, SystemInfoRestfulSer, $sessionStorage, MsgBoxModel) {
                        var msgBox = new MsgBoxModel();
                        msgBox.OpenLoadingDialog();
                        msgBoxTemp = msgBox;

                        var promise_Global = $q.defer();
                        //Get Languar Pack
                        var promise_GetLanguagePack = new function () {
                            var deferred_GetLanguagePack = $q.defer();
                            SystemInfoRestfulSer.GetMultiLingualResSer(defaultLangKey).then(function (response) {
                                var multiLignualRes = angular.fromJson(response.data);
                                if (multiLignualRes != null && multiLignualRes != undefined) {
                                    $sessionStorage.MultiLingualRes = multiLignualRes;
                                    $sessionStorage.SelectedLang = defaultLangKey;
                                }
                                deferred_GetLanguagePack.resolve();
                            });
                            return deferred_GetLanguagePack.promise;
                        };
                        //Get System Info
                        var promise_GetSysInfo = new function () {
                            var staticContentModel = new StaticContentModel();
                            var deferred_GetSysInfo = $q.defer();
                            SystemInfoRestfulSer.GetSystemInfo(new WCFAuthInfoVM()).then(function (response) {
                                var sysInfo = new SystemInfoVM(response.data);
                                if (!angular.isUndefined(sysInfo) && sysInfo != null) {
                                    $cookies.putObject(Keys.SystemInfo_CookiesKey, sysInfo);
                                }
                                deferred_GetSysInfo.resolve();
                            });
                            return deferred_GetSysInfo.promise;
                        };
                        //Wait serice response and navigate to login page
                        $q.all([promise_GetLanguagePack, promise_GetSysInfo]).then(function () {
                            promise_Global.resolve();
                            msgBoxTemp.CloseLoadingDialog();
                            $state.go('LoginModule.Login');
                        });
                        return promise_Global.promise;
                    }]
                },
                controller: 'GlobalController'
            })
            .state('Error', {
                url: "/Error",
                abstract: true
            })
            .state('Error.AccessDenied', {
                url: '/AccessDenied',
                views: {
                    '@': {
                        templateUrl: Path.ErrorPath + 'AccessDenied.tpl.html',
                        controller: 'ErrorController'
                    }
                }
            })
            .state('Error.SessionTimeout', {
                url: '/SessionTimeout',
                views: {
                    '@': {
                        templateUrl: Path.ErrorPath + 'SessionTimeout.tpl.html',
                        controller: 'ErrorController'
                    }
                }
            })
            .state('Error.PageNotFound', {
                url: '/PageNotFound',
                views: {
                    '@': {
                        templateUrl: Path.ErrorPath + 'PageNotFound.tpl.html',
                        controller: 'ErrorController'
                    }
                }
            })
            .state('Error.Exception', {
                url: '/Exception',
                views: {
                    '@': {
                        templateUrl: Path.ErrorPath + 'Exception.tpl.html',
                        controller: 'ErrorController'
                    }
                }
            })
            .state('Error.RestServiceError', {
                url: '/RestServiceError',
                views: {
                    '@': {
                        templateUrl: Path.ErrorPath + 'RestServiceError.tpl.html',
                        controller: 'ErrorController'
                    }
                }
            })
    };

    config_Home.$inject = injectParams_Config;

    CoolPrivilegeControl.config(config_Home);

    CoolPrivilegeControl.run(['$rootScope', '$state', '$stateParams', '$log', '$sessionStorage', 'MsgBoxModel', function ($rootScope, $state, $stateParams, $log, $sessionStorage, MsgBoxModel) {

        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        $rootScope.$on(ExceptionType.SessionTimeout, function (ev, args) {
            if (!angular.isUndefined(msgBoxTemp) && msgBoxTemp != null) {
                msgBox.CloseLoadingDialog();
            }
            if (!angular.isUndefined($sessionStorage.SessionTimeoutInfo) && $sessionStorage.SessionTimeoutInfo != null) {
                delete $sessionStorage.SessionTimeoutInfo;
            }
            $sessionStorage.SessionTimeoutInfo = args;

            $state.go('Error.SessionTimeout');

            ev.preventDefault();
        });

        $rootScope.$on(ExceptionType.AccessDenied, function (ev, args) {
            if (!angular.isUndefined(msgBoxTemp) && msgBoxTemp != null) {
                msgBox.CloseLoadingDialog();
            }
            if (!angular.isUndefined($sessionStorage.AccessDeniedInfo) && $sessionStorage.AccessDeniedInfo != null) {
                delete $sessionStorage.AccessDeniedInfo;
            }
            $sessionStorage.AccessDeniedInfo = args;
            var temp = $rootScope.$state;
            $state.go('Error.AccessDenied');

            ev.preventDefault();
        });

        $rootScope.$on(ExceptionType.ValidationError, function (ev, args) {
            var msgBoxModel = new MsgBoxModel();
            msgBoxModel.ShowMsg(BootstrapDialog.TYPE_DANGER, args.PageTitle || "", args.Msgs || "");
            ev.preventDefault();
        });

        $rootScope.$on(ExceptionType.RestServiceError, function (ev, args) {
            if (!angular.isUndefined(msgBoxTemp) && msgBoxTemp != null) {
                msgBox.CloseLoadingDialog();
            }
            if (!angular.isUndefined($sessionStorage.RestServiceErrorInfo) && $sessionStorage.RestServiceErrorInfo != null) {
                delete $sessionStorage.RestServiceErrorInfo;
            }
            $sessionStorage.RestServiceErrorInfo = args;
            var temp = $rootScope.$state;
            $state.go('Error.RestServiceError');
            ev.preventDefault();
        });

        $rootScope.$on(ExceptionType.Others, function (ev, args) {
            if (!angular.isUndefined(msgBoxTemp) && msgBoxTemp != null) {
                msgBox.CloseLoadingDialog();
            }
            if (!angular.isUndefined($sessionStorage.ExceptionInfo) && $sessionStorage.ExceptionInfo != null) {
                delete $sessionStorage.ExceptionInfo;
            }
            $sessionStorage.ExceptionInfo = args;
            var temp = $rootScope.$state;
            $state.go('Error.Exception');
            ev.preventDefault();
        });

        $rootScope.$on(ExceptionType.PageNotFound, function (ev, args) {
            if (!angular.isUndefined(msgBoxTemp) && msgBoxTemp != null) {
                msgBox.CloseLoadingDialog();
            }
            if (!angular.isUndefined($sessionStorage.PageNotFoundInfo) && $sessionStorage.PageNotFoundInfo != null) {
                delete $sessionStorage.PageNotFoundInfo;
            }
            $sessionStorage.PageNotFoundInfo = args;
            var temp = $rootScope.$state;
            $state.go('Error.SessionTimeout');

            ev.preventDefault();
        });
    }]
    );
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-cookies.js" />

(function () {
    'use strict';

    var injectParams_Config = ['CustomStateProvider'];

    var config = function (CustomStateProvider) {

        CustomStateProvider.AddState(Path.FunsPath, "AuditLogManage", "", {
            initData: ['WCFAuthInfoVM', 'AuditLogMgtSerClient', 'MsgBoxModel', function (WCFAuthInfoVM, AuditLogMgtSerClient, MsgBoxModel) {
                var msgBox = new MsgBoxModel();
                msgBox.OpenLoadingDialog();
                msgBoxTemp = msgBox;

                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return AuditLogMgtSerClient.GetEmptyAuditLogVM(wcfAuthInfoVM);
            }],
        });
    }
    config.$inject = injectParams_Config;

    angular.module("MainModule").config(config);

    var injectParams = ['$scope', '$document', '$q', '$stateParams', '$location', '$sessionStorage', '$state', 'WCFAuthInfoVM', 'ClientSessionMgt', 'AuditLogMgtSerClient', 'WCFReturnResult', 'MsgBoxModel'];

    var AuditLogManageController = function ($scope, $document, $q, $stateParams, $location, $sessionStorage, $state, WCFAuthInfoVM, ClientSessionMgt, AuditLogMgtSerClient, WCFReturnResult, MsgBoxModel) {

        var pageTitle = "";

        init();

        function GetAuditLogList(modelCriteria, ActionType) {
            var deferred = $q.defer();

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();
            wcfAuthInfoVM.SetFunKeyAndTypeKey("AuditLogManage", ActionType);

            modelCriteria.entity_WCFAuthInfoVM = wcfAuthInfoVM;

            AuditLogMgtSerClient.GetListWithPaging(modelCriteria).then(function (resp) {
                deferred.resolve(resp);
            }, function (resp) {
                deferred.reject(resp);
            });

            return deferred.promise;
        }

        function init() {
            var msgBox = msgBoxTemp;

            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                $scope.Captions = {
                    // Search and List Screen Resources
                    SearchCriteria: $sessionStorage.MultiLingualRes.SearchCriteria,
                    List: $sessionStorage.MultiLingualRes.List,
                    Operation: $sessionStorage.MultiLingualRes.Operation,
                    Search: $sessionStorage.MultiLingualRes.Search,

                    OperationType: $sessionStorage.MultiLingualRes.OperationType,
                    Date: $sessionStorage.MultiLingualRes.Date,
                    From: $sessionStorage.MultiLingualRes.From,
                    To: $sessionStorage.MultiLingualRes.To,
                    Operator: $sessionStorage.MultiLingualRes.Operator,
                    TableName: $sessionStorage.MultiLingualRes.TableName,
                    OriginalValue: $sessionStorage.MultiLingualRes.OriginalValue,
                    NewValue: $sessionStorage.MultiLingualRes.NewValue,
                    RecordKey: $sessionStorage.MultiLingualRes.RecordKey,

                    Key: $sessionStorage.MultiLingualRes.Key,
                    Value: $sessionStorage.MultiLingualRes.Value,

                    All: $sessionStorage.MultiLingualRes.All,
                    Create: $sessionStorage.MultiLingualRes.Create,
                    Edit: $sessionStorage.MultiLingualRes.Edit,
                    Delete: $sessionStorage.MultiLingualRes.Delete,


                    ClickToViewDetails: $sessionStorage.MultiLingualRes.ClickToViewDetails,

                    //Edit Resources
                    BacktoList: $sessionStorage.MultiLingualRes.BacktoList,

                    //E019
                    E019: $sessionStorage.MultiLingualRes.E019,
                };
                pageTitle = $sessionStorage.MultiLingualRes.AuditLogManage;

                angular.element(window.document)[0].title = pageTitle;
            }

            var clientSessionMgt = new ClientSessionMgt();
            clientSessionMgt.PageTitle = pageTitle;
            var systemInfo = clientSessionMgt.GetSystemInfo();
            $scope.SystemInfo = systemInfo;

            $scope.DateTimeFormat = $scope.SystemInfo.DateFormat + " " + $scope.SystemInfo.TimeFormat;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
            $scope.PageSize = $scope.SystemInfo.PageSize;

            $scope.Sort = $scope.Sort || '';
            $scope.SortDir = $scope.SortDir || '';

            $scope.reverse = $scope.SortDir == "desc" ? true : false;

            var wcfReturnResult = new WCFReturnResult(AuditLogMgtSerClient.GetEmptyAuditLogVM_Result());
            var strMsgs = wcfReturnResult.GetErrMsgs();

            $('#DateFromDiv').datetimepicker({
                format: $scope.SystemInfo.DateFormat.toUpperCase()
            });
            $('#DateToDiv').datetimepicker({
                format: $scope.SystemInfo.DateFormat.toUpperCase()
            });

            if (!wcfReturnResult.HasMsgs()) {

                $scope.EntityAuditLog = wcfReturnResult.Entity_AuditLogVM;

                $scope.Sort = $scope.Sort || $scope.EntityAuditLog.DefaultSortColumn;
                $scope.SortDir = $scope.SortDir || $scope.EntityAuditLog.DefaultSortDir;
                $scope.reverse = $scope.SortDir == "desc" ? true : false;

                var modelCriteria = {
                    'entity_WCFAuthInfoVM': wcfAuthInfoVM,
                    'entity_SearchCriteria': $scope.EntityAuditLog,
                    'int_CurrentPage': 1,
                    'int_PageSize': $scope.SystemInfo.PageSize,
                    'str_SortColumn': $scope.Sort,
                    'str_SortDir': $scope.SortDir,
                    'str_CustomFilter': "",
                };

                var task = GetAuditLogList(modelCriteria, "View");

                $q.all([task]).then(function (resp) {
                    var wcfReturnResult = new WCFReturnResult(resp[0].data);

                    var strMsgs = wcfReturnResult.GetErrMsgs();

                    msgBox.CloseLoadingDialog();
                    if (!wcfReturnResult.HasMsgs()) {
                        for (var i = 0; i < wcfReturnResult.EntityList_AuditLogVM.length; ++i) {
                            if (!angular.isUndefined(wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate) && wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate != null)
                                wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate = moment(wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate).toDate();
                        }
                        $scope.EntityList_AuditLogVM = wcfReturnResult.EntityList_AuditLogVM;

                        $scope.AuditLogList = $scope.EntityList_AuditLogVM;

                        $scope.CurrPageIndex = 1;
                        $scope.TotalCount = wcfReturnResult.Int_TotalRecordCount;
                    }
                    else {
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                    }
                }, function (resp) {
                    msgBox.CloseLoadingDialog();
                    var wcfErrorContract = new WCFErrorContract(resp.data);
                    throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
                });
            }
            else {
                msgBox.CloseLoadingDialog();
                throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
            }
        };

        $scope.Search = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            var dateFrom = $document[0].SearchForm.elements.DateFrom.value;
            var dateTo = $document[0].SearchForm.elements.DateTo.value;

            if (dateFrom != "")
                $scope.EntityAuditLog.DateFrom = "/Date(" + moment(dateFrom, $scope.SystemInfo.DateFormat.toUpperCase()).format("x") + ")/";
            if (dateTo != "")
                $scope.EntityAuditLog.DateTo = "/Date(" + moment(dateTo, $scope.SystemInfo.DateFormat.toUpperCase()).format("x") + ")/";

            var modelCriteria = {
                'entity_WCFAuthInfoVM': wcfAuthInfoVM,
                'entity_SearchCriteria': $scope.EntityAuditLog,
                'int_CurrentPage': 1,
                'int_PageSize': $scope.SystemInfo.PageSize,
                'str_SortColumn': $scope.Sort,
                'str_SortDir': $scope.SortDir,
                'str_CustomFilter': "",
            };

            var task = GetAuditLogList(modelCriteria, "Search");

            $q.all([task]).then(function (resp) {
                var wcfReturnResult = new WCFReturnResult(resp[0].data);

                var strMsgs = wcfReturnResult.GetErrMsgs();

                msgBox.CloseLoadingDialog();
                if (!wcfReturnResult.HasMsgs()) {
                    for (var i = 0; i < wcfReturnResult.EntityList_AuditLogVM.length; ++i) {
                        if (!angular.isUndefined(wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate) && wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate != null)
                            wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate = moment(wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate).toDate();
                    }

                    $scope.EntityList_AuditLogVM = wcfReturnResult.EntityList_AuditLogVM;

                    $scope.AuditLogList = $scope.EntityList_AuditLogVM;

                    $scope.CurrPageIndex = 1;
                    $scope.TotalCount = wcfReturnResult.Int_TotalRecordCount;
                }
                else {
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Sort By
        $scope.SortBy = function (sortCol) {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            $scope.reverse = true;
            if ($scope.Sort == sortCol) {
                $scope.SortDir = $scope.SortDir == "desc" ? "asc" : "desc";
            }
            else {
                $scope.Sort = sortCol;
                $scope.SortDir = "asc";
            }

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            var modelCriteria = {
                'entity_WCFAuthInfoVM': wcfAuthInfoVM,
                'entity_SearchCriteria': $scope.EntityAuditLog,
                'int_CurrentPage': $scope.CurrPageIndex,
                'int_PageSize': $scope.SystemInfo.PageSize,
                'str_SortColumn': $scope.Sort,
                'str_SortDir': $scope.SortDir,
                'str_CustomFilter': "",
            };

            var task = GetAuditLogList(modelCriteria, "View");

            $q.all([task]).then(function (resp) {
                var wcfReturnResult = new WCFReturnResult(resp[0].data);

                var strMsgs = wcfReturnResult.GetErrMsgs();
                msgBox.CloseLoadingDialog();
                if (!wcfReturnResult.HasMsgs()) {
                    for (var i = 0; i < wcfReturnResult.EntityList_AuditLogVM.length; ++i) {
                        if (!angular.isUndefined(wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate) && wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate != null)
                            wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate = moment(wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate).toDate();
                    }
                    $scope.EntityList_AuditLogVM = wcfReturnResult.EntityList_AuditLogVM;

                    $scope.AuditLogList = $scope.EntityList_AuditLogVM;

                    $scope.TotalCount = wcfReturnResult.Int_TotalRecordCount;
                }
                else {
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //PageIndexChange
        $scope.PageIndexChange = function (CurrPageIndex) {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            var modelCriteria = {
                'entity_WCFAuthInfoVM': wcfAuthInfoVM,
                'entity_SearchCriteria': $scope.EntityAuditLog,
                'int_CurrentPage': CurrPageIndex,
                'int_PageSize': $scope.SystemInfo.PageSize,
                'str_SortColumn': $scope.Sort,
                'str_SortDir': $scope.SortDir,
                'str_CustomFilter': "",
            };

            var task = GetAuditLogList(modelCriteria, "View");

            $q.all([task]).then(function (resp) {
                var wcfReturnResult = new WCFReturnResult(resp[0].data);

                var strMsgs = wcfReturnResult.GetErrMsgs();
                msgBox.CloseLoadingDialog();
                if (!wcfReturnResult.HasMsgs()) {
                    for (var i = 0; i < wcfReturnResult.EntityList_AuditLogVM.length; ++i) {
                        if (!angular.isUndefined(wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate) && wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate != null)
                            wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate = moment(wcfReturnResult.EntityList_AuditLogVM[i].AL_CreateDate).toDate();
                    }
                    $scope.EntityList_AuditLogVM = wcfReturnResult.EntityList_AuditLogVM;

                    $scope.AuditLogList = $scope.EntityList_AuditLogVM;

                    $scope.CurrPageIndex = CurrPageIndex;

                    $scope.TotalCount = wcfReturnResult.Int_TotalRecordCount;
                }
                else {
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        function ShowDetailsInfo(strTitle, str) {

            var strHtml = new Array();
            var strArray = str.split(";");
            //strHtml.push("<div class=\"table-responsive\">")
            strHtml.push("<table class=\"table table-bordered table-condensed\" style=\"table-layout:fixed;\" contenteditable=\"false\">");
            strHtml.push("<thead>");
            strHtml.push("<tr>");
            strHtml.push("<th align=\"center\" style=\"text-align:center;\" width=\"100px\" class=\"info\">" + $scope.Captions.Key + "</th>");
            strHtml.push("<th align=\"center\" style=\"text-align:center;\" width=\"250px\" class=\"info\">" + $scope.Captions.Value + "</th>");
            strHtml.push("</tr>");
            strHtml.push("</thead>");
            strHtml.push("<tbody>");

            for (var i = 0; i < strArray.length; ++i) {
                strHtml.push("<tr>");
                var keyValuePair = strArray[i].split("=");
                if (keyValuePair.length >= 2) {
                    for (var j = 0; j < 2; ++j) {
                        if (j == 0) {
                            strHtml.push("<td align=\"left\" class=\"wordwrap\" width=\"100px\">");
                            strHtml.push(keyValuePair[j]);
                        }
                        else {
                            strHtml.push("<td align=\"left\" class=\"wordwrap\" width=\"250px\">");
                            var temp = new Array();
                            if (keyValuePair.length > 2) {
                                for (var k = j; k < keyValuePair.length; ++k) {
                                    temp.push(keyValuePair[k]);
                                }
                            }
                            else {
                                temp.push(keyValuePair[j]);
                            }
                            strHtml.push(temp.join("="));
                        }
                        strHtml.push("</td>");
                    }
                }
                strHtml.push("</tr>");
            }
            strHtml.push("</tbody>");
            strHtml.push("</table>");
            //strHtml.push("</div>");
            var msgBoxModel = new MsgBoxModel();
            msgBoxModel.ShowMsg(BootstrapDialog.TYPE_INFO, strTitle, strHtml.join(""));
        }

        $scope.ClickToViewOrgValue = function (OrgValue) {
            ShowDetailsInfo($scope.Captions.OriginalValue, OrgValue);
        };

        $scope.ClickToViewNewValue = function (NewValue) {
            ShowDetailsInfo($scope.Captions.NewValue, NewValue);
        };
    };

    AuditLogManageController.$inject = injectParams;

    angular.module("MainModule").controller('AuditLogManageController', AuditLogManageController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-cookies.js" />

(function () {
    'use strict';

    var injectParams_Config = ['CustomStateProvider'];

    var config = function (CustomStateProvider) {

        CustomStateProvider.AddState(Path.FunsPath, "AuthorizedHistoryManage", "", {
            initData: ['WCFAuthInfoVM', 'AuthHisSerClient', 'MsgBoxModel', function (WCFAuthInfoVM, AuthHisSerClient, MsgBoxModel) {
                var msgBox = new MsgBoxModel();
                msgBox.OpenLoadingDialog();
                msgBoxTemp = msgBox;
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return AuthHisSerClient.GetEmptyAuthHisVM(wcfAuthInfoVM);
            }],
        });
    }
    config.$inject = injectParams_Config;

    angular.module("MainModule").config(config);

    var injectParams = ['$scope', '$q', '$stateParams', '$location', '$sessionStorage', '$state', 'WCFAuthInfoVM', 'ClientSessionMgt', 'AuthHisSerClient', 'WCFReturnResult', 'MsgBoxModel'];

    var AuthorizedHistoryManageController = function ($scope, $q, $stateParams, $location, $sessionStorage, $state, WCFAuthInfoVM, ClientSessionMgt, AuthHisSerClient, WCFReturnResult, MsgBoxModel) {

        var pageTitle = "";

        init();

        function GetAuthHisList(modelCriteria, ActionType) {
            var deferred = $q.defer();

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();
            wcfAuthInfoVM.SetFunKeyAndTypeKey("AuthorizedHistoryManage", ActionType);

            modelCriteria.entity_WCFAuthInfoVM = wcfAuthInfoVM;

            AuthHisSerClient.GetListWithPaging(modelCriteria).then(function (resp) {
                deferred.resolve(resp);
            }, function (resp) {
                deferred.reject(resp);
            });

            return deferred.promise;
        }

        function init() {
            var msgBox = msgBoxTemp;

            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                $scope.Captions = {
                    // Search and List Screen Resources
                    SearchCriteria: $sessionStorage.MultiLingualRes.SearchCriteria,
                    List: $sessionStorage.MultiLingualRes.List,
                    Operation: $sessionStorage.MultiLingualRes.Operation,
                    Search: $sessionStorage.MultiLingualRes.Search,

                    LoginName: $sessionStorage.MultiLingualRes.LoginName,
                    OperationType: $sessionStorage.MultiLingualRes.OperationType,
                    Datetime: $sessionStorage.MultiLingualRes.Datetime,

                    All: $sessionStorage.MultiLingualRes.All,
                    Login: $sessionStorage.MultiLingualRes.Login,
                    Logout: $sessionStorage.MultiLingualRes.Logout,

                    Delete: $sessionStorage.MultiLingualRes.Delete,

                    //Edit Resources
                    BacktoList: $sessionStorage.MultiLingualRes.BacktoList,

                    //E019
                    E019: $sessionStorage.MultiLingualRes.E019,
                };
                pageTitle = $sessionStorage.MultiLingualRes.AuthorizedHistoryManage;

                angular.element(window.document)[0].title = pageTitle;
            }

            var clientSessionMgt = new ClientSessionMgt();
            clientSessionMgt.PageTitle = pageTitle;
            var systemInfo = clientSessionMgt.GetSystemInfo();
            $scope.SystemInfo = systemInfo;

            $scope.DateTimeFormat = $scope.SystemInfo.DateFormat + " " + $scope.SystemInfo.TimeFormat;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
            $scope.PageSize = $scope.SystemInfo.PageSize;

            $scope.Sort = $scope.Sort || '';
            $scope.SortDir = $scope.SortDir || '';

            $scope.reverse = $scope.SortDir == "desc" ? true : false;

            var wcfReturnResult = new WCFReturnResult(AuthHisSerClient.GetEmptyAuthHisVM_Result());
            var strMsgs = wcfReturnResult.GetErrMsgs();

            if (!wcfReturnResult.HasMsgs()) {

                $scope.EntityAuthHis = wcfReturnResult.Entity_AuthHisVM;

                $scope.Sort = $scope.Sort || $scope.EntityAuthHis.DefaultSortColumn;
                $scope.SortDir = $scope.SortDir || $scope.EntityAuthHis.DefaultSortDir;
                $scope.reverse = $scope.SortDir == "desc" ? true : false;

                var modelCriteria = {
                    'entity_WCFAuthInfoVM': wcfAuthInfoVM,
                    'entity_SearchCriteria': $scope.EntityAuthHis,
                    'int_CurrentPage': 1,
                    'int_PageSize': $scope.SystemInfo.PageSize,
                    'str_SortColumn': $scope.Sort,
                    'str_SortDir': $scope.SortDir,
                    'str_CustomFilter': "",
                };

                var task = GetAuthHisList(modelCriteria, "View");

                $q.all([task]).then(function (resp) {
                    var wcfReturnResult = new WCFReturnResult(resp[0].data);

                    var strMsgs = wcfReturnResult.GetErrMsgs();
                    msgBox.CloseLoadingDialog();
                    if (!wcfReturnResult.HasMsgs()) {
                        for (var i = 0; i < wcfReturnResult.EntityList_AuthorizedHistoryVM.length; ++i) {
                            if (!angular.isUndefined(wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime) && wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime != null)
                                wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime = moment(wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime).toDate();
                        }
                        $scope.EntityList_AuthorizedHistoryVM = wcfReturnResult.EntityList_AuthorizedHistoryVM;

                        $scope.AuthHisList = $scope.EntityList_AuthorizedHistoryVM;

                        $scope.CurrPageIndex = 1;
                        $scope.TotalCount = wcfReturnResult.Int_TotalRecordCount;
                    }
                    else {
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                    }
                }, function (resp) {
                    msgBox.CloseLoadingDialog();
                    var wcfErrorContract = new WCFErrorContract(resp.data);
                    throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
                });
            }
            else {
                msgBox.CloseLoadingDialog();
                throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
            }
        };

        $scope.Search = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            var modelCriteria = {
                'entity_WCFAuthInfoVM': wcfAuthInfoVM,
                'entity_SearchCriteria': $scope.EntityAuthHis,
                'int_CurrentPage': 1,
                'int_PageSize': $scope.SystemInfo.PageSize,
                'str_SortColumn': $scope.Sort,
                'str_SortDir': $scope.SortDir,
                'str_CustomFilter': "",
            };

            var task = GetAuthHisList(modelCriteria, "Search");

            $q.all([task]).then(function (resp) {
                var wcfReturnResult = new WCFReturnResult(resp[0].data);

                var strMsgs = wcfReturnResult.GetErrMsgs();
                msgBox.CloseLoadingDialog();
                if (!wcfReturnResult.HasMsgs()) {
                    for (var i = 0; i < wcfReturnResult.EntityList_AuthorizedHistoryVM.length; ++i) {
                        if (!angular.isUndefined(wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime) && wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime != null)
                            wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime = moment(wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime).toDate();
                    }

                    $scope.EntityList_AuthorizedHistoryVM = wcfReturnResult.EntityList_AuthorizedHistoryVM;

                    $scope.AuthHisList = $scope.EntityList_AuthorizedHistoryVM;

                    $scope.CurrPageIndex = 1;
                    $scope.TotalCount = wcfReturnResult.Int_TotalRecordCount;
                }
                else {
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Sort By
        $scope.SortBy = function (sortCol) {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            $scope.reverse = true;
            if ($scope.Sort == sortCol) {
                $scope.SortDir = $scope.SortDir == "desc" ? "asc" : "desc";
            }
            else {
                $scope.Sort = sortCol;
                $scope.SortDir = "asc";
            }

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            var modelCriteria = {
                'entity_WCFAuthInfoVM': wcfAuthInfoVM,
                'entity_SearchCriteria': $scope.EntityAuthHis,
                'int_CurrentPage': $scope.CurrPageIndex,
                'int_PageSize': $scope.SystemInfo.PageSize,
                'str_SortColumn': $scope.Sort,
                'str_SortDir': $scope.SortDir,
                'str_CustomFilter': "",
            };

            var task = GetAuthHisList(modelCriteria, "View");

            $q.all([task]).then(function (resp) {
                var wcfReturnResult = new WCFReturnResult(resp[0].data);

                var strMsgs = wcfReturnResult.GetErrMsgs();
                msgBox.CloseLoadingDialog();
                if (!wcfReturnResult.HasMsgs()) {
                    for (var i = 0; i < wcfReturnResult.EntityList_AuthorizedHistoryVM.length; ++i) {
                        if (!angular.isUndefined(wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime) && wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime != null)
                            wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime = moment(wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime).toDate();
                    }
                    $scope.EntityList_AuthorizedHistoryVM = wcfReturnResult.EntityList_AuthorizedHistoryVM;

                    $scope.AuthHisList = $scope.EntityList_AuthorizedHistoryVM;

                    $scope.TotalCount = wcfReturnResult.Int_TotalRecordCount;
                }
                else {
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //PageIndexChange
        $scope.PageIndexChange = function (CurrPageIndex) {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            var modelCriteria = {
                'entity_WCFAuthInfoVM': wcfAuthInfoVM,
                'entity_SearchCriteria': $scope.EntityAuthHis,
                'int_CurrentPage': CurrPageIndex,
                'int_PageSize': $scope.SystemInfo.PageSize,
                'str_SortColumn': $scope.Sort,
                'str_SortDir': $scope.SortDir,
                'str_CustomFilter': "",
            };

            var task = GetAuthHisList(modelCriteria, "View");

            $q.all([task]).then(function (resp) {
                var wcfReturnResult = new WCFReturnResult(resp[0].data);

                var strMsgs = wcfReturnResult.GetErrMsgs();
                msgBox.CloseLoadingDialog();
                if (!wcfReturnResult.HasMsgs()) {
                    for (var i = 0; i < wcfReturnResult.EntityList_AuthorizedHistoryVM.length; ++i) {
                        if (!angular.isUndefined(wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime) && wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime != null)
                            wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime = moment(wcfReturnResult.EntityList_AuthorizedHistoryVM[i].OperationDatetime).toDate();
                    }
                    $scope.EntityList_AuthorizedHistoryVM = wcfReturnResult.EntityList_AuthorizedHistoryVM;

                    $scope.AuthHisList = $scope.EntityList_AuthorizedHistoryVM;

                    $scope.CurrPageIndex = CurrPageIndex;

                    $scope.TotalCount = wcfReturnResult.Int_TotalRecordCount;
                }
                else {
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Delete
        $scope.Delete = function (AuthHisID) {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("AuthorizedHistoryManage", "Delete");

            var delModel = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                str_AuthHisID: AuthHisID
            };

            AuthHisSerClient.Delete(delModel).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var result = new WCFReturnResult(resp.data);

                    if (!result.HasError()) {
                        $state.reload();
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I001 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                    }
                }
            }, function (resp) {
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };
    };

    AuthorizedHistoryManageController.$inject = injectParams;

    angular.module("MainModule").controller('AuthorizedHistoryManageController', AuthorizedHistoryManageController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-cookies.js" />
/// <reference path="../Scripts/angular-route.js" />

(function () {
    'use strict';

    var injectParams = ['$scope', '$state', '$sessionStorage', 'MsgBoxModel'];

    var ErrorController = function ($scope, $state, $sessionStorage, MsgBoxModel) {

        $scope.ExceptionMsg = $sessionStorage.ExceptionInfo;
        $scope.SessionTimeout = $sessionStorage.SessionTimeoutInfo;
        $scope.PageNotFound = $sessionStorage.PageNotFoundInfo;
        $scope.RestServiceError = $sessionStorage.RestServiceErrorInfo;
        $scope.AccessDenied = $sessionStorage.AccessDeniedInfo;

        $scope.GoToLoginPage = function () {
            if (angular.isUndefined($sessionStorage.ExceptionInfo))
                delete $sessionStorage.ExceptionInfo;

            if (angular.isUndefined($sessionStorage.PageNotFoundInfo))
                delete $sessionStorage.PageNotFoundInfo;

            if (angular.isUndefined($sessionStorage.SessionTimeoutInfo))
                delete $sessionStorage.SessionTimeoutInfo;

            if (angular.isUndefined($sessionStorage.RestServiceErrorInfo))
                delete $sessionStorage.RestServiceErrorInfo;
            $state.go("CPCS");
        };
    };

    ErrorController.$inject = injectParams;

    angular.module("CoolPrivilegeControl").controller('ErrorController', ErrorController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-cookies.js" />

(function () {
    'use strict';

    var injectParams_Config = ['CustomStateProvider'];

    var config = function (CustomStateProvider) {

        CustomStateProvider.AddState(Path.FunsPath, "FManage", "", {
            initData: ['WCFAuthInfoVM', 'FunMgtSerClient', 'MsgBoxModel', function (WCFAuthInfoVM, FunMgtSerClient, MsgBoxModel) {
                var msgBox = new MsgBoxModel();
                msgBox.OpenLoadingDialog();
                msgBoxTemp = msgBox;
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return FunMgtSerClient.GetEmptyFVM(wcfAuthInfoVM);
            }]
        });

        CustomStateProvider.AddState(Path.FunsPath, "FManage", "Edit", {
            initData: ['$stateParams', 'WCFAuthInfoVM', 'FunMgtSerClient', function ($stateParams, WCFAuthInfoVM, FunMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();
                wcfAuthInfoVM.SetFunKeyAndTypeKey("FManage", "Edit");

                var jsonData = {
                    entity_WCFAuthInfoVM: wcfAuthInfoVM,
                    str_FunID: $stateParams.FID
                };

                return FunMgtSerClient.GetEntityByID(jsonData);
            }],
            initData_FunType: ['WCFAuthInfoVM', 'FunTypeMgtSerClient', function (WCFAuthInfoVM, FunTypeMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return FunTypeMgtSerClient.GetAllFunType(wcfAuthInfoVM);
            }]
        }, "/:FID");


        CustomStateProvider.AddState(Path.FunsPath, "FManage", "Create", {
            initData: ['WCFAuthInfoVM', 'FunMgtSerClient', function (WCFAuthInfoVM, FunMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return FunMgtSerClient.GetEmptyFVM(wcfAuthInfoVM);
            }],
            initData_FunType: ['WCFAuthInfoVM', 'FunTypeMgtSerClient', function (WCFAuthInfoVM, FunTypeMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return FunTypeMgtSerClient.GetAllFunType(wcfAuthInfoVM);
            }]
        });
    }
    config.$inject = injectParams_Config;

    angular.module("MainModule").config(config);

    var injectParams = ['$scope', '$q', '$filter', '$stateParams', '$location', '$sessionStorage', '$state', 'WCFAuthInfoVM', 'ClientSessionMgt', 'FunMgtSerClient', 'FunTypeMgtSerClient', 'CheckPrivilegeSerClient', 'WCFReturnResult', 'MsgBoxModel'];

    var FManageController = function ($scope, $q, $filter, $stateParams, $location, $sessionStorage, $state, WCFAuthInfoVM, ClientSessionMgt, FunMgtSerClient, FunTypeMgtSerClient, CheckPrivilegeSerClient, WCFReturnResult, MsgBoxModel) {
        var orderBy = $filter('orderBy');
        var filter = $filter('filter');

        var pageTitle = "";

        init();

        function GetFunList(modelCriteria, ActionType) {
            var deferred = $q.defer();

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();
            wcfAuthInfoVM.SetFunKeyAndTypeKey("FManage", ActionType);

            modelCriteria.entity_WCFAuthInfoVM = wcfAuthInfoVM;

            FunMgtSerClient.GetListWithPaging(modelCriteria).then(function (resp) {
                deferred.resolve(resp);
            }, function (resp) {
                deferred.reject(resp);
            });

            return deferred.promise;
        }

        function init() {
            var msgBox = msgBoxTemp;

            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                $scope.Captions = {
                    // Search and List Screen Resources
                    SearchCriteria: $sessionStorage.MultiLingualRes.SearchCriteria,
                    List: $sessionStorage.MultiLingualRes.List,
                    FManage_Create: $sessionStorage.MultiLingualRes.FManage_Create,
                    Operation: $sessionStorage.MultiLingualRes.Operation,
                    Delete: $sessionStorage.MultiLingualRes.Delete,
                    Edit: $sessionStorage.MultiLingualRes.Edit,
                    Search: $sessionStorage.MultiLingualRes.Search,
                    Save: $sessionStorage.MultiLingualRes.Save,

                    FunctionPath: $sessionStorage.MultiLingualRes.FunctionPath,
                    FunctionKey: $sessionStorage.MultiLingualRes.FunctionKey,
                    FunctionName: $sessionStorage.MultiLingualRes.FunctionName,
                    FunctionUrl: $sessionStorage.MultiLingualRes.FunctionUrl,
                    FunctionType: $sessionStorage.MultiLingualRes.FunctionType,

                    //Edit Resources
                    BacktoList: $sessionStorage.MultiLingualRes.BacktoList,

                    //E019
                    E019: $sessionStorage.MultiLingualRes.E019,

                    //I002
                    I002: $sessionStorage.MultiLingualRes.I002
                };
                if ($state.includes("Main.FManage.Edit")) {
                    pageTitle = $sessionStorage.MultiLingualRes.FManage_Edit;
                }
                else if ($state.includes("Main.FManage.Create")) {
                    pageTitle = $sessionStorage.MultiLingualRes.FManage_Create;
                }
                else {
                    pageTitle = $sessionStorage.MultiLingualRes.FManage;
                }

                angular.element(window.document)[0].title = pageTitle;
            }

            var clientSessionMgt = new ClientSessionMgt();
            clientSessionMgt.PageTitle = pageTitle;
            var systemInfo = clientSessionMgt.GetSystemInfo();
            $scope.SystemInfo = systemInfo;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            if ($state.includes("Main.FManage.Edit")) {
                $scope.EditId = $stateParams.FID;

                var result_GetEntityByID = FunMgtSerClient.GetEntityByID_Result();

                if (!angular.isUndefined(result_GetEntityByID) && result_GetEntityByID != null) {
                    var wcfReturnResult = new WCFReturnResult(result_GetEntityByID);
                    var strMsgs = wcfReturnResult.GetErrMsgs();
                    if (!wcfReturnResult.HasMsgs()) {
                        $scope.EntityF = wcfReturnResult.Entity_FunctionVM;
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }

                    //public Guid ID
                    //public string FunctionType
                    //public bool Selected
                    $scope.SelectedTypeList = [];
                    if (FunTypeMgtSerClient.GetAllFunType_Result().length > 0) {
                        angular.forEach(FunTypeMgtSerClient.GetAllFunType_Result(), function (value, key) {
                            angular.forEach($scope.EntityF.SelectedTypeList, function (value1, key1) {
                                if (value1.ID == value.ID) {
                                    value.Selected = value1.Selected;
                                }
                            });

                            var model = {
                                ID: value.ID,
                                FunctionType: value.FunctionType,
                                Selected: value.Selected
                            };
                            $scope.SelectedTypeList.push(model);
                        });
                    }
                }
                msgBox.CloseLoadingDialog();
            }
            else if ($state.includes("Main.FManage.Create")) {
                var wcfReturnResult = new WCFReturnResult(FunMgtSerClient.GetEmptyFVM_Result());
                var strMsgs = wcfReturnResult.GetErrMsgs();

                if (!wcfReturnResult.HasMsgs()) {
                    $scope.EntityF = wcfReturnResult.Entity_FunctionVM;
                }
                else {
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                }

                $scope.SelectedTypeList = [];
                if (FunTypeMgtSerClient.GetAllFunType_Result().length > 0) {
                    angular.forEach(FunTypeMgtSerClient.GetAllFunType_Result(), function (value, key) {
                        var model = {
                            ID: value.ID,
                            FunctionType: value.FunctionType,
                            Selected: value.Selected
                        };
                        $scope.SelectedTypeList.push(model);
                    });
                }
                msgBox.CloseLoadingDialog();
            }
            else {
                $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
                $scope.PageSize = $scope.SystemInfo.PageSize;

                $scope.Sort = $scope.Sort || '';
                $scope.SortDir = $scope.SortDir || '';

                $scope.reverse = $scope.SortDir == "desc" ? true : false;

                var wcfReturnResult = new WCFReturnResult(FunMgtSerClient.GetEmptyFVM_Result());
                var strMsgs = wcfReturnResult.GetErrMsgs();

                if (!wcfReturnResult.HasMsgs()) {
                    $scope.EntityF = wcfReturnResult.Entity_FunctionVM;

                    $scope.Sort = $scope.Sort || $scope.EntityF.DefaultSortColumn;
                    $scope.SortDir = $scope.SortDir || $scope.EntityF.DefaultSortDir;
                    $scope.reverse = $scope.SortDir == "desc" ? true : false;

                    var modelCriteria = {
                        'entity_WCFAuthInfoVM': undefined,
                        'entity_SearchCriteria': null,
                        'int_CurrentPage': 1,
                        'int_PageSize': 2147483647,//$scope.SystemInfo.PageSize,
                        'str_SortColumn': "",
                        'str_SortDir': "",
                        'str_CustomFilter': "",
                    };

                    var task = GetFunList(modelCriteria, "View");

                    var wcfAuthInfoVM = new WCFAuthInfoVM();
                    wcfAuthInfoVM.initData();
                    wcfAuthInfoVM.SetFunKeyAndTypeKey("FManage", "Create");

                    var model_CheckPrivilege_Create = {
                        entity_WCFAuthInfoVM: wcfAuthInfoVM,
                        isCheckFunType: true
                    };

                    var task_CheckPrivilege_Create = CheckPrivilegeSerClient.CheckPrivilege(model_CheckPrivilege_Create);

                    $q.all([task, task_CheckPrivilege_Create]).then(function (resp) {
                        var wcfReturnResult = new WCFReturnResult(resp[0].data);

                        var result_CheckPrivilege_Create = resp[1].data;
                        $scope.CheckPrivilege_Create = result_CheckPrivilege_Create;

                        var strMsgs = wcfReturnResult.GetErrMsgs();

                        msgBox.CloseLoadingDialog();
                        if (!wcfReturnResult.HasMsgs()) {
                            $scope.EntityList_FunctionVM = wcfReturnResult.EntityList_FunctionVM;

                            $scope.FunList = orderBy($scope.EntityList_FunctionVM, $scope.Sort, $scope.reverse);

                            $scope.FunList = filter($scope.FunList, { FunctionPath: $scope.EntityF.FunctionPath });
                            $scope.FunList = filter($scope.FunList, { FunctionKey: $scope.EntityF.FunctionKey });
                            $scope.FunList = filter($scope.FunList, { FunctionName: $scope.EntityF.FunctionName });

                            $scope.CurrPageIndex = 1;
                            $scope.TotalCount = $scope.FunList.length;
                            $scope.FunList = $scope.FunList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
                        }
                        else {
                            throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                        }
                    }, function (resp) {
                        msgBox.CloseLoadingDialog();
                        var wcfErrorContract = new WCFErrorContract(resp.data);
                        throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
                    });
                }
                else {
                    msgBox.CloseLoadingDialog();
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                }
            }
        };

        $scope.CheckAll = function () {
            angular.forEach($scope.SelectedTypeList, function (value, key) {
                if ($scope.isCheckAll)
                    value.Selected = true;
                else
                    value.Selected = false;
            });
        };

        $scope.CheckFunType = function () {
            var temp = true;
            angular.forEach($scope.SelectedTypeList, function (value, index) {
                if (!value) {
                    temp = false;
                    return;
                }
            });
            scope.isCheckAll = temp;
        };

        $scope.Search = function () {
            if ($scope.EntityList_FunctionVM.length > 0) {
                $scope.FunList = orderBy($scope.EntityList_FunctionVM, $scope.Sort, $scope.reverse);

                $scope.FunList = filter($scope.FunList, { FunctionPath: $scope.EntityF.FunctionPath });
                $scope.FunList = filter($scope.FunList, { FunctionKey: $scope.EntityF.FunctionKey });
                $scope.FunList = filter($scope.FunList, { FunctionName: $scope.EntityF.FunctionName });

                $scope.CurrPageIndex = 1;
                $scope.TotalCount = $scope.FunList.length;
                $scope.FunList = $scope.FunList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        };

        //Delete
        $scope.Delete = function (FID) {
            pageTitle = $sessionStorage.MultiLingualRes.FManage_Delete;

            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("FManage", "Delete");

            var delModel = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                str_FunID: FID
            };

            FunMgtSerClient.Delete(delModel).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var result = new WCFReturnResult(resp.data);

                    if (!result.HasError()) {
                        if ($state.includes("Main.FManage.Edit")) {
                            $state.go("Main.FManage", {}, { reload: true });
                        }
                        else {
                            $state.reload();
                        }
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I001 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Edit
        $scope.Edit = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("FManage", "Edit");

            $scope.EntityF.SelectedTypeList = $scope.SelectedTypeList

            var jsonData = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                entity_FunVM: $scope.EntityF
            };

            FunMgtSerClient.Update(jsonData).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var wcfReturnResult = new WCFReturnResult(resp.data);
                    var strMsgs = wcfReturnResult.GetErrMsgs();

                    if (!wcfReturnResult.HasMsgs()) {
                        $state.reload();
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I000 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Create
        $scope.Create = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("FManage", "Create");

            $scope.EntityF.SelectedTypeList = $scope.SelectedTypeList

            var jsonData = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                entity_FunVM: $scope.EntityF
            };

            FunMgtSerClient.Create(jsonData).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var wcfReturnResult = new WCFReturnResult(resp.data);
                    var strMsgs = wcfReturnResult.GetErrMsgs();

                    if (!wcfReturnResult.HasMsgs()) {
                        $state.go("Main.FManage", {}, { reload: true });
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I000 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Sort By
        $scope.SortBy = function (sortCol) {
            $scope.reverse = true;
            if ($scope.Sort == sortCol) {
                $scope.SortDir = $scope.SortDir == "desc" ? "asc" : "desc";
                $scope.reverse = $scope.SortDir == "desc" ? true : false;
            }
            else {
                $scope.Sort = sortCol;
                $scope.SortDir = "asc";
                $scope.reverse = false;
            }

            if ($scope.EntityList_FunctionVM.length > 0) {

                $scope.FunList = orderBy($scope.EntityList_FunctionVM, $scope.Sort, $scope.reverse);

                $scope.FunList = filter($scope.FunList, { FunctionPath: $scope.EntityF.FunctionPath });
                $scope.FunList = filter($scope.FunList, { FunctionKey: $scope.EntityF.FunctionKey });
                $scope.FunList = filter($scope.FunList, { FunctionName: $scope.EntityF.FunctionName });

                //$scope.CurrPageIndex = parseInt($scope.CurPageIndex) ;
                $scope.TotalCount = $scope.FunList.length;
                $scope.FunList = $scope.FunList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        };

        //PageIndexChange
        $scope.PageIndexChange = function (CurrPageIndex) {
            if ($scope.EntityList_FunctionVM.length > 0) {
                $scope.FunList = orderBy($scope.EntityList_FunctionVM, $scope.Sort, $scope.reverse);

                $scope.FunList = filter($scope.FunList, { FunctionType: $scope.EntityF.FunctionType });

                $scope.CurrPageIndex = CurrPageIndex;
                $scope.TotalCount = $scope.FunList.length;
                $scope.FunList = $scope.FunList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        }
    };

    FManageController.$inject = injectParams;

    angular.module("MainModule").controller('FManageController', FManageController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-cookies.js" />

(function () {
    'use strict';

    var injectParams_Config = ['CustomStateProvider'];

    var config = function (CustomStateProvider) {

        CustomStateProvider.AddState(Path.FunsPath, "FTManage", "", {
            initData: ['WCFAuthInfoVM', 'FunTypeMgtSerClient', 'MsgBoxModel', function (WCFAuthInfoVM, FunTypeMgtSerClient, MsgBoxModel) {
                var msgBox = new MsgBoxModel();
                msgBox.OpenLoadingDialog();
                msgBoxTemp = msgBox;

                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return FunTypeMgtSerClient.GetEmptyFTVM(wcfAuthInfoVM);
            }]
        });

        CustomStateProvider.AddState(Path.FunsPath, "FTManage", "Edit", {
            initData: ['$stateParams', 'WCFAuthInfoVM', 'FunTypeMgtSerClient', function ($stateParams, WCFAuthInfoVM, FunTypeMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();
                wcfAuthInfoVM.SetFunKeyAndTypeKey("FTManage", "Edit");

                var jsonData = {
                    entity_WCFAuthInfoVM: wcfAuthInfoVM,
                    str_FTID: $stateParams.FTID
                };

                return FunTypeMgtSerClient.GetEntityByID(jsonData);
            }]
        }, "/:FTID");


        CustomStateProvider.AddState(Path.FunsPath, "FTManage", "Create", {
            initData: ['WCFAuthInfoVM', 'FunTypeMgtSerClient', function (WCFAuthInfoVM, FunTypeMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return FunTypeMgtSerClient.GetEmptyFTVM(wcfAuthInfoVM);
            }]
        });
    }
    config.$inject = injectParams_Config;

    angular.module("MainModule").config(config);

    var injectParams = ['$scope', '$q', '$filter', '$stateParams', '$location', '$sessionStorage', '$state', 'WCFAuthInfoVM', 'ClientSessionMgt', 'FunTypeMgtSerClient', 'CheckPrivilegeSerClient', 'WCFReturnResult', 'MsgBoxModel'];

    var FTManageController = function ($scope, $q, $filter, $stateParams, $location, $sessionStorage, $state, WCFAuthInfoVM, ClientSessionMgt, FunTypeMgtSerClient, CheckPrivilegeSerClient, WCFReturnResult, MsgBoxModel) {
        var orderBy = $filter('orderBy');
        var filter = $filter('filter');

        var pageTitle = "";

        init();

        function GetFTList(modelCriteria, ActionType) {
            var deferred = $q.defer();

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();
            wcfAuthInfoVM.SetFunKeyAndTypeKey("FManage", ActionType);

            modelCriteria.entity_WCFAuthInfoVM = wcfAuthInfoVM;

            FunTypeMgtSerClient.GetListWithPaging(modelCriteria).then(function (resp) {
                deferred.resolve(resp);
            }, function (resp) {
                deferred.reject(resp);
            });

            return deferred.promise;
        }

        function init() {
            var msgBox = msgBoxTemp;

            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                $scope.Captions = {
                    // Search and List Screen Resources
                    SearchCriteria: $sessionStorage.MultiLingualRes.SearchCriteria,
                    List: $sessionStorage.MultiLingualRes.List,
                    FunctionType: $sessionStorage.MultiLingualRes.FunctionType,
                    FTManage_Create: $sessionStorage.MultiLingualRes.FTManage_Create,
                    Operation: $sessionStorage.MultiLingualRes.Operation,
                    Delete: $sessionStorage.MultiLingualRes.Delete,
                    Edit: $sessionStorage.MultiLingualRes.Edit,
                    Search: $sessionStorage.MultiLingualRes.Search,
                    Save: $sessionStorage.MultiLingualRes.Save,

                    //Edit Resources
                    BacktoList: $sessionStorage.MultiLingualRes.BacktoList,

                    //E019
                    E019: $sessionStorage.MultiLingualRes.E019
                };
                if ($state.includes("Main.FTManage.Edit")) {
                    pageTitle = $sessionStorage.MultiLingualRes.FTManage_Edit;
                }
                else if ($state.includes("Main.FTManage.Create")) {
                    pageTitle = $sessionStorage.MultiLingualRes.FTManage_Create;
                }
                else {
                    pageTitle = $sessionStorage.MultiLingualRes.FTManage;
                }

                angular.element(window.document)[0].title = pageTitle;
            }

            var clientSessionMgt = new ClientSessionMgt();
            clientSessionMgt.PageTitle = pageTitle;
            var systemInfo = clientSessionMgt.GetSystemInfo();
            $scope.SystemInfo = systemInfo;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            if ($state.includes("Main.FTManage.Edit")) {
                $scope.EditId = $stateParams.FTID;

                var result_GetEntityByID = FunTypeMgtSerClient.GetEntityByID_Result();

                if (!angular.isUndefined(result_GetEntityByID) && result_GetEntityByID != null) {
                    var wcfReturnResult = new WCFReturnResult(result_GetEntityByID);
                    var strMsgs = wcfReturnResult.GetErrMsgs();
                    if (!wcfReturnResult.HasMsgs()) {
                        $scope.EntityFT = wcfReturnResult.Entity_FunctionTypeVM;
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }
                }
                msgBox.CloseLoadingDialog();
            }
            else if ($state.includes("Main.FTManage.Create")) {
                var wcfReturnResult = new WCFReturnResult(FunTypeMgtSerClient.GetEmptyFTVM_Result());
                var strMsgs = wcfReturnResult.GetErrMsgs();

                if (!wcfReturnResult.HasMsgs()) {
                    $scope.EntityFT = wcfReturnResult.Entity_FunctionTypeVM;
                }
                else {
                    msgBox.CloseLoadingDialog();
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                }
                msgBox.CloseLoadingDialog();
            }
            else {
                $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
                $scope.PageSize = $scope.SystemInfo.PageSize;

                $scope.Sort = $scope.Sort || '';
                $scope.SortDir = $scope.SortDir || '';

                $scope.reverse = $scope.SortDir == "desc" ? true : false;

                var wcfReturnResult = new WCFReturnResult(FunTypeMgtSerClient.GetEmptyFTVM_Result());
                var strMsgs = wcfReturnResult.GetErrMsgs();

                if (!wcfReturnResult.HasMsgs()) {
                    $scope.EntityFT = wcfReturnResult.Entity_FunctionTypeVM;

                    $scope.Sort = $scope.Sort || $scope.EntityFT.DefaultSortColumn;
                    $scope.SortDir = $scope.SortDir || $scope.EntityFT.DefaultSortDir;
                    $scope.reverse = $scope.SortDir == "desc" ? true : false;

                    var modelCriteria = {
                        'entity_WCFAuthInfoVM': undefined,
                        'entity_SearchCriteria': null,
                        'int_CurrentPage': 1,
                        'int_PageSize': 2147483647,//$scope.SystemInfo.PageSize,
                        'str_SortColumn': "",
                        'str_SortDir': "",
                        'str_CustomFilter': "",
                    };

                    var task = GetFTList(modelCriteria, "View");

                    var wcfAuthInfoVM = new WCFAuthInfoVM();
                    wcfAuthInfoVM.initData();
                    wcfAuthInfoVM.SetFunKeyAndTypeKey("FTManage", "Create");

                    var model_CheckPrivilege_Create = {
                        entity_WCFAuthInfoVM: wcfAuthInfoVM,
                        isCheckFunType: true
                    };

                    var task_CheckPrivilege_Create = CheckPrivilegeSerClient.CheckPrivilege(model_CheckPrivilege_Create);

                    $q.all([task, task_CheckPrivilege_Create]).then(function (resp) {
                        var wcfReturnResult = new WCFReturnResult(resp[0].data);

                        var result_CheckPrivilege_Create = resp[1].data;
                        $scope.CheckPrivilege_Create = result_CheckPrivilege_Create;

                        var strMsgs = wcfReturnResult.GetErrMsgs();

                        msgBox.CloseLoadingDialog();
                        if (!wcfReturnResult.HasMsgs()) {
                            $scope.EntityList_FunctionTypeVM = wcfReturnResult.EntityList_FunctionTypeVM;

                            $scope.FunTypeList = orderBy($scope.EntityList_FunctionTypeVM, $scope.Sort, $scope.reverse);

                            $scope.FunTypeList = filter($scope.FunTypeList, { FunctionType: $scope.EntityFT.FunctionType });

                            $scope.CurrPageIndex = 1;
                            $scope.TotalCount = $scope.FunTypeList.length;
                            $scope.FunTypeList = $scope.FunTypeList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
                        }
                        else {
                            throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                        }
                    }, function (resp) {
                        msgBox.CloseLoadingDialog();
                        var wcfErrorContract = new WCFErrorContract(resp.data);
                        throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
                    });
                }
                else {
                    msgBox.CloseLoadingDialog();
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                }
            }
        }

        $scope.Search = function () {
            if ($scope.EntityList_FunctionTypeVM.length > 0) {
                $scope.FunTypeList = orderBy($scope.EntityList_FunctionTypeVM, $scope.Sort, $scope.reverse);

                $scope.FunTypeList = filter($scope.FunTypeList, { FunctionType: $scope.EntityFT.FunctionType });

                $scope.CurrPageIndex = 1;
                $scope.TotalCount = $scope.FunTypeList.length;
                $scope.FunTypeList = $scope.FunTypeList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        };

        //Delete
        $scope.Delete = function (FTID) {
            pageTitle = $sessionStorage.MultiLingualRes.FTManage_Delete;
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("FTManage", "Delete");

            var delModel = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                str_FTID: FTID
            };

            FunTypeMgtSerClient.Delete(delModel).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var result = new WCFReturnResult(resp.data);

                    if (!result.HasError()) {
                        if ($state.includes("Main.FTManage.Edit")) {
                            $state.go("Main.FTManage", {}, { reload: true });
                        }
                        else {
                            $state.reload();
                        }
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I001 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Edit
        $scope.Edit = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("FTManage", "Edit");

            var jsonData = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                entity_FunTypeVM: $scope.EntityFT
            };

            FunTypeMgtSerClient.Update(jsonData).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var wcfReturnResult = new WCFReturnResult(resp.data);
                    var strMsgs = wcfReturnResult.GetErrMsgs();

                    if (!wcfReturnResult.HasMsgs()) {
                        $state.reload();
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I000 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Create
        $scope.Create = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("FManage", "Create");

            var jsonData = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                entity_FunTypeVM: $scope.EntityFT
            };

            FunTypeMgtSerClient.Create(jsonData).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var wcfReturnResult = new WCFReturnResult(resp.data);
                    var strMsgs = wcfReturnResult.GetErrMsgs();

                    if (!wcfReturnResult.HasMsgs()) {
                        $state.go("Main.FTManage", {}, { reload: true });
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I000 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Sort By
        $scope.SortBy = function (sortCol) {
            $scope.reverse = true;
            if ($scope.Sort == sortCol) {
                $scope.SortDir = $scope.SortDir == "desc" ? "asc" : "desc";
                $scope.reverse = $scope.SortDir == "desc" ? true : false;
            }
            else {
                $scope.Sort = sortCol;
                $scope.SortDir = "asc";
                $scope.reverse = false;
            }

            if ($scope.EntityList_FunctionTypeVM.length > 0) {

                $scope.FunTypeList = orderBy($scope.EntityList_FunctionTypeVM, $scope.Sort, $scope.reverse);

                $scope.FunTypeList = filter($scope.FunTypeList, { FunctionType: $scope.EntityFT.FunctionType });

                //$scope.CurrPageIndex = parseInt($scope.CurPageIndex) ;
                $scope.TotalCount = $scope.FunTypeList.length;
                $scope.FunTypeList = $scope.FunTypeList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        };

        //PageIndexChange
        $scope.PageIndexChange = function (CurrPageIndex) {
            if ($scope.EntityList_FunctionTypeVM.length > 0) {
                $scope.FunTypeList = orderBy($scope.EntityList_FunctionTypeVM, $scope.Sort, $scope.reverse);

                $scope.FunTypeList = filter($scope.FunTypeList, { FunctionType: $scope.EntityFT.FunctionType });

                $scope.CurrPageIndex = CurrPageIndex;
                $scope.TotalCount = $scope.FunTypeList.length;
                $scope.FunTypeList = $scope.FunTypeList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        }
    };

    FTManageController.$inject = injectParams;

    angular.module("MainModule").controller('FTManageController', FTManageController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-cookies.js" />

(function () {
    'use strict';

    var injectParams_Config = ['$stateProvider', '$urlRouterProvider'];

    var config_Home = function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('Main.Home', {
                url: '/Home',
                abstract: true
            })
            .state('Main.Home.IndexPart1', {
                url: '',
                views: {
                    'Content@Main': {
                        templateUrl: Path.HomePath + 'Home_1.tpl.html',
                        controller: 'HomeController'
                    }
                }
            })
            .state('Main.Home.IndexPart2', {
                url: '/Part2',
                views: {
                    'Content@Main': {
                        templateUrl: Path.HomePath + 'Home_2.tpl.html',
                        controller: 'HomeController'
                    }
                }
            })
            .state('Main.Home.IndexPart3', {
                url: '/Part3',
                views: {
                    'Content@Main': {
                        templateUrl: Path.HomePath + 'Home_3.tpl.html',
                        controller: 'HomeController'
                    }
                }
            })
        ;
    };
    config_Home.$inject = injectParams_Config;

    angular.module("MainModule").config(config_Home);

    var injectParams = ['$state', '$scope', '$sessionStorage'];

    var HomeController = function ($state, $scope, $sessionStorage) {
        var pageTitle = "";
        function init() {
            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                if ($state.includes("Main.Home.IndexPart1")) {
                    pageTitle = $sessionStorage.MultiLingualRes.Home_IndexPart1;
                }
                else if ($state.includes("Main.Home.IndexPart2")) {
                    pageTitle = $sessionStorage.MultiLingualRes.Home_IndexPart2;
                }
                else if ($state.includes("Main.Home.IndexPart3")) {
                    pageTitle = $sessionStorage.MultiLingualRes.Home_IndexPart3;
                }
            }
            angular.element(window.document)[0].title = pageTitle;
        }
        init();
    };

    HomeController.$inject = injectParams;

    angular.module("MainModule").controller('HomeController', HomeController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Models/MsgBoxModel.js" />

(function () {
    'use strict';
    var injectParams_Config = ['CustomStateProvider'];

    var config = function (CustomStateProvider) {

        CustomStateProvider.AddState(Path.FunsPath, "LUOrgDetailsManage", "", {
            initData: ['WCFAuthInfoVM', 'OrgDetailMgtSerClient', 'MsgBoxModel', function (WCFAuthInfoVM, OrgDetailMgtSerClient, MsgBoxModel) {
                var msgBox = new MsgBoxModel();
                msgBox.OpenLoadingDialog();
                msgBoxTemp = msgBox;

                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return OrgDetailMgtSerClient.GetEmptyOrgDetailVM(wcfAuthInfoVM);
            }]
        });

        CustomStateProvider.AddState(Path.FunsPath, "LUOrgDetailsManage", "Edit", {
            initData: ['$stateParams', 'WCFAuthInfoVM', 'OrgDetailMgtSerClient', function ($stateParams, WCFAuthInfoVM, OrgDetailMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();
                wcfAuthInfoVM.SetFunKeyAndTypeKey("LUOrgDetailsManage", "Edit");

                var jsonData = {
                    entity_WCFAuthInfoVM: wcfAuthInfoVM,
                    str_OrgDetailsID: $stateParams.OrgDetailID
                };

                return OrgDetailMgtSerClient.GetEntityByID(jsonData);
            }],
            initData_Funs: ['WCFAuthInfoVM', 'FunMgtSerClient', function (WCFAuthInfoVM, FunMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return FunMgtSerClient.GetAll(wcfAuthInfoVM);
            }],
            initData_Roles: ['WCFAuthInfoVM', 'RoleMgtSerClient', function (WCFAuthInfoVM, RoleMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return RoleMgtSerClient.GetAll(wcfAuthInfoVM);
            }],
            initData_GetPrivilegeByUserID: ['$stateParams', 'WCFAuthInfoVM', 'OrgDetailMgtSerClient', function ($stateParams, WCFAuthInfoVM, OrgDetailMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                var jsonData = {
                    entity_WCFAuthInfoVM: wcfAuthInfoVM,
                    str_ID: $stateParams.OrgDetailID,
                    enum_RoleType: RoleType.Organization
                };
                return OrgDetailMgtSerClient.GetPrivilegeByUserID(jsonData);
            }],
            initData_GetRoleSettingsByOrgDID: ['$stateParams', 'WCFAuthInfoVM', 'OrgDetailMgtSerClient', function ($stateParams, WCFAuthInfoVM, OrgDetailMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                var jsonData = {
                    entity_WCFAuthInfoVM: wcfAuthInfoVM,
                    str_OrgDetailsID: $stateParams.OrgDetailID,
                };
                return OrgDetailMgtSerClient.GetRoleSettingsByOrgDID(jsonData);
            }],
        }, "/:OrgDetailID");


        CustomStateProvider.AddState(Path.FunsPath, "LUOrgDetailsManage", "Create", {
            initData: ['WCFAuthInfoVM', 'OrgDetailMgtSerClient', function (WCFAuthInfoVM, OrgDetailMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return OrgDetailMgtSerClient.GetEmptyOrgDetailVM(wcfAuthInfoVM);
            }],
            initData_Funs: ['WCFAuthInfoVM', 'FunMgtSerClient', function (WCFAuthInfoVM, FunMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return FunMgtSerClient.GetAll(wcfAuthInfoVM);
            }],
            initData_Roles: ['WCFAuthInfoVM', 'RoleMgtSerClient', function (WCFAuthInfoVM, RoleMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return RoleMgtSerClient.GetAll(wcfAuthInfoVM);
            }],
        });
    }
    config.$inject = injectParams_Config;

    angular.module("MainModule").config(config);

    var injectParams = ['$scope', '$q', '$filter', '$stateParams', '$location', '$sessionStorage', '$state', 'WCFAuthInfoVM', 'ClientSessionMgt', 'FunMgtSerClient', 'OrgDetailMgtSerClient', 'RoleMgtSerClient', 'CheckPrivilegeSerClient', 'WCFReturnResult', 'WCFErrorContract', 'MsgBoxModel'];

    var LUOrgDetailsManageController = function ($scope, $q, $filter, $stateParams, $location, $sessionStorage, $state, WCFAuthInfoVM, ClientSessionMgt, FunMgtSerClient, OrgDetailMgtSerClient, RoleMgtSerClient, CheckPrivilegeSerClient, WCFReturnResult, WCFErrorContract, MsgBoxModel) {
        var orderBy = $filter('orderBy');
        var filter = $filter('filter');

        var pageTitle = "";

        init();

        function GetOrgDetailsList(modelCriteria, ActionType) {
            var deferred = $q.defer();

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();
            wcfAuthInfoVM.SetFunKeyAndTypeKey("LUOrgDetailsManage", ActionType);

            modelCriteria.entity_WCFAuthInfoVM = wcfAuthInfoVM;

            OrgDetailMgtSerClient.GetListWithPaging(modelCriteria).then(function (resp) {
                deferred.resolve(resp);
            }, function (resp) {
                deferred.reject(resp);
            });

            return deferred.promise;
        }

        function init() {
            var msgBox = msgBoxTemp;

            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                $scope.Captions = {
                    // Search and List Screen Resources
                    SearchCriteria: $sessionStorage.MultiLingualRes.SearchCriteria,
                    List: $sessionStorage.MultiLingualRes.List,
                    LUOrgDetailsManage_Create: $sessionStorage.MultiLingualRes.LUOrgDetailsManage_Create,
                    LUOrgDetailsManage_Edit: $sessionStorage.MultiLingualRes.LUOrgDetailsManage_Edit,
                    Operation: $sessionStorage.MultiLingualRes.Operation,
                    Delete: $sessionStorage.MultiLingualRes.Delete,
                    Edit: $sessionStorage.MultiLingualRes.Edit,
                    Search: $sessionStorage.MultiLingualRes.Search,
                    Save: $sessionStorage.MultiLingualRes.Save,

                    //Edit Resources
                    BacktoList: $sessionStorage.MultiLingualRes.BacktoList,

                    //Create Resources
                    Key: $sessionStorage.MultiLingualRes.Key,
                    Type: $sessionStorage.MultiLingualRes.Type,
                    SpecificFunctions: $sessionStorage.MultiLingualRes.SpecificFunctions,
                    AsRoleSetting: $sessionStorage.MultiLingualRes.AsRoleSetting,
                    RoleName: $sessionStorage.MultiLingualRes.RoleName,
                    All: $sessionStorage.MultiLingualRes.All,

                    OrgDetailsKey: $sessionStorage.MultiLingualRes.OrgDetailsKey,
                    OrgDetailsType: $sessionStorage.MultiLingualRes.OrgDetailsType,

                    //E019
                    E019: $sessionStorage.MultiLingualRes.E019
                };
                if ($state.includes("Main.LUOrgDetailsManage.Edit")) {
                    pageTitle = $sessionStorage.MultiLingualRes.LUOrganizationManage_Edit;
                }
                else if ($state.includes("Main.LUOrgDetailsManage.Create")) {
                    pageTitle = $sessionStorage.MultiLingualRes.LUOrganizationManage_Create;
                }
                else {
                    pageTitle = $sessionStorage.MultiLingualRes.LUOrganizationManage;
                }

                angular.element(window.document)[0].title = pageTitle;
            }

            var clientSessionMgt = new ClientSessionMgt();
            clientSessionMgt.PageTitle = pageTitle;
            var systemInfo = clientSessionMgt.GetSystemInfo();
            $scope.SystemInfo = systemInfo;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            if ($state.includes("Main.LUOrgDetailsManage.Edit")) {
                $scope.EditId = $stateParams.RoleID;

                var result_GetEntityByID = OrgDetailMgtSerClient.GetEntityByID_Result();

                if (!angular.isUndefined(result_GetEntityByID) && result_GetEntityByID != null) {
                    var wcfReturnResult = new WCFReturnResult(result_GetEntityByID);
                    var strMsgs = wcfReturnResult.GetErrMsgs();
                    if (!wcfReturnResult.HasMsgs()) {
                        $scope.EntityOrgDetail = wcfReturnResult.Entity_LUserOrgDetailsVM;
                    }
                    else {
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }

                    $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
                    $scope.PageSize = $scope.SystemInfo.PageSize;

                    $scope.FunsList = FunMgtSerClient.GetAll_Result();

                    if ($scope.EntityOrgDetail.OrgDetailsType == 1) {
                        var result = OrgDetailMgtSerClient.GetPrivilegeByUserID_Result();

                        if (!angular.isUndefined(result) && result != null)
                            $scope.SpeFunDetailList = result;
                        $scope.SpeRoleDetailList = [];
                    }
                    else if ($scope.EntityOrgDetail.OrgDetailsType == 2) {
                        var result = OrgDetailMgtSerClient.GetRoleSettingsByOrgDID_Result();
                        if (!angular.isUndefined(result) && result != null)
                            $scope.SpeRoleDetailList = result;
                        $scope.SpeFunDetailList = [];
                    }

                    $scope.RolesList = RoleMgtSerClient.GetAll_Result();

                    $scope.msgBoxTitle = pageTitle;
                }
                msgBox.CloseLoadingDialog();
            }
            else if ($state.includes("Main.LUOrgDetailsManage.Create")) {
                var wcfReturnResult = new WCFReturnResult(OrgDetailMgtSerClient.GetEmptyOrgDetailVM_Result());
                var strMsgs = wcfReturnResult.GetErrMsgs();

                if (!wcfReturnResult.HasMsgs()) {
                    $scope.EntityOrgDetail = wcfReturnResult.Entity_LUserOrgDetailsVM;
                }
                else {
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                }

                $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
                $scope.PageSize = $scope.SystemInfo.PageSize;

                $scope.FunsList = FunMgtSerClient.GetAll_Result();

                $scope.SpeFunDetailList = [];

                $scope.RolesList = RoleMgtSerClient.GetAll_Result();

                $scope.SpeRoleDetailList = [];

                $scope.msgBoxTitle = pageTitle;

                msgBox.CloseLoadingDialog();
            }
            else {
                $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
                $scope.PageSize = $scope.SystemInfo.PageSize;

                $scope.Sort = $scope.Sort || '';
                $scope.SortDir = $scope.SortDir || '';

                $scope.reverse = $scope.SortDir == "desc" ? true : false;

                var wcfReturnResult = new WCFReturnResult(OrgDetailMgtSerClient.GetEmptyOrgDetailVM_Result());
                var strMsgs = wcfReturnResult.GetErrMsgs();

                if (!wcfReturnResult.HasMsgs()) {
                    $scope.EntityOrgDetail = wcfReturnResult;

                    $scope.Sort = $scope.Sort || $scope.EntityOrgDetail.DefaultSortColumn;
                    $scope.SortDir = $scope.SortDir || $scope.EntityOrgDetail.DefaultSortDir;
                    $scope.reverse = $scope.SortDir == "desc" ? true : false;

                    var modelCriteria = {
                        'entity_WCFAuthInfoVM': undefined,
                        'entity_SearchCriteria': null,
                        'int_CurrentPage': 1,
                        'int_PageSize': 2147483647,//$scope.SystemInfo.PageSize,
                        'str_SortColumn': "",
                        'str_SortDir': "",
                        'str_CustomFilter': "",
                    };

                    var task = GetOrgDetailsList(modelCriteria, "View");

                    var wcfAuthInfoVM = new WCFAuthInfoVM();
                    wcfAuthInfoVM.initData();
                    wcfAuthInfoVM.SetFunKeyAndTypeKey("LUOrgDetailsManage", "Create");

                    var model_CheckPrivilege_Create = {
                        entity_WCFAuthInfoVM: wcfAuthInfoVM,
                        isCheckFunType: true
                    };

                    var task_CheckPrivilege_Create = CheckPrivilegeSerClient.CheckPrivilege(model_CheckPrivilege_Create);

                    $q.all([task, task_CheckPrivilege_Create]).then(function (resp) {
                        var wcfReturnResult = new WCFReturnResult(resp[0].data);

                        var result_CheckPrivilege_Create = resp[1].data;
                        $scope.CheckPrivilege_Create = result_CheckPrivilege_Create;

                        var strMsgs = wcfReturnResult.GetErrMsgs();

                        msgBox.CloseLoadingDialog();
                        if (!wcfReturnResult.HasMsgs()) {

                            $scope.EntityList_LUserOrgDetailsVM = wcfReturnResult.EntityList_LUserOrgDetailsVM;

                            $scope.OrgDetailList = orderBy($scope.EntityList_LUserOrgDetailsVM, $scope.Sort, $scope.reverse);

                            $scope.OrgDetailList = filter($scope.OrgDetailList, { OrgDetailsKey: $scope.EntityOrgDetail.OrgDetailsKey });
                            if (!angular.isUndefined($scope.EntityOrgDetail.OrgDetailsType) && $scope.EntityOrgDetail.OrgDetailsType != null)
                                $scope.OrgDetailList = filter($scope.OrgDetailList, { OrgDetailsType: $scope.EntityOrgDetail.OrgDetailsType });
                            $scope.OrgDetailList = filter($scope.OrgDetailList, { StrRoles: $scope.EntityOrgDetail.StrRoles });

                            $scope.CurrPageIndex = 1;
                            $scope.TotalCount = $scope.OrgDetailList.length;
                            $scope.OrgDetailList = $scope.OrgDetailList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
                        }
                        else {
                            throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                        }
                    }, function (resp) {
                        msgBox.CloseLoadingDialog();
                        var wcfErrorContract = new WCFErrorContract(resp.data);
                        throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
                    });
                }
                else {
                    msgBox.CloseLoadingDialog();
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                }
            }
        };

        $scope.Search = function () {
            if ($scope.EntityList_LUserOrgDetailsVM.length > 0) {
                $scope.OrgDetailList = orderBy($scope.EntityList_LUserOrgDetailsVM, $scope.Sort, $scope.reverse);

                $scope.OrgDetailList = filter($scope.OrgDetailList, { OrgDetailsKey: $scope.EntityOrgDetail.OrgDetailsKey });
                if (!angular.isUndefined($scope.EntityOrgDetail.OrgDetailsType) && $scope.EntityOrgDetail.OrgDetailsType != null)
                    $scope.OrgDetailList = filter($scope.OrgDetailList, { OrgDetailsType: $scope.EntityOrgDetail.OrgDetailsType });
                $scope.OrgDetailList = filter($scope.OrgDetailList, { StrRoles: $scope.EntityOrgDetail.StrRoles });

                $scope.CurrPageIndex = 1;
                $scope.TotalCount = $scope.OrgDetailList.length;
                $scope.OrgDetailList = $scope.OrgDetailList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        };

        //Delete
        $scope.Delete = function (OrgDetailID) {
            pageTitle = $sessionStorage.MultiLingualRes.LUOrgDetailsManage_Delete;

            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("LUOrgDetailsManage", "Delete");

            var delModel = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                str_OrgDetailsID: OrgDetailID
            };

            OrgDetailMgtSerClient.Delete(delModel).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var result = new WCFReturnResult(resp.data);

                    if (!result.HasError()) {
                        if ($state.includes("Main.LUOrgDetailsManage.Edit")) {
                            $state.go("Main.LUOrgDetailsManage", {}, { reload: true });
                        }
                        else {
                            $state.reload();
                        }
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I001 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Edit
        $scope.Edit = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("LUOrgDetailsManage", "Edit");

            if ($scope.EntityOrgDetail.OrgDetailsType == 1) {
                $scope.EntityOrgDetail.EntityList_FDInfo = $scope.SpeFunDetailList;
            }
            else if ($scope.EntityOrgDetail.OrgDetailsType == 2) {
                $scope.EntityOrgDetail.EntityList_Role = $scope.SpeRoleDetailList;
            }

            var jsonData = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                entity_OrgDetailsVM: $scope.EntityOrgDetail
            };

            OrgDetailMgtSerClient.Update(jsonData).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var wcfReturnResult = new WCFReturnResult(resp.data);
                    var strMsgs = wcfReturnResult.GetErrMsgs();

                    if (!wcfReturnResult.HasMsgs()) {
                        $state.reload();
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I000 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Create
        $scope.Create = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("LUOrgDetailsManage", "Create");

            if ($scope.EntityOrgDetail.OrgDetailsType == 1) {
                $scope.EntityOrgDetail.EntityList_FDInfo = $scope.SpeFunDetailList;
            }
            else if ($scope.EntityOrgDetail.OrgDetailsType == 2) {
                $scope.EntityOrgDetail.EntityList_Role = $scope.SpeRoleDetailList;
            }

            var jsonData = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                entity_OrgDetailsVM: $scope.EntityOrgDetail
            };

            OrgDetailMgtSerClient.Create(jsonData).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var wcfReturnResult = new WCFReturnResult(resp.data);
                    var strMsgs = wcfReturnResult.GetErrMsgs();

                    if (!wcfReturnResult.HasMsgs()) {
                        $state.go("Main.LUOrgDetailsManage", {}, { reload: true });
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I000 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Sort By
        $scope.SortBy = function (sortCol) {
            $scope.reverse = true;
            if ($scope.Sort == sortCol) {
                $scope.SortDir = $scope.SortDir == "desc" ? "asc" : "desc";
                $scope.reverse = $scope.SortDir == "desc" ? true : false;
            }
            else {
                $scope.Sort = sortCol;
                $scope.SortDir = "asc";
                $scope.reverse = false;
            }

            if ($scope.EntityList_LUserOrgDetailsVM.length > 0) {

                $scope.OrgDetailList = orderBy($scope.EntityList_LUserOrgDetailsVM, $scope.Sort, $scope.reverse);

                $scope.OrgDetailList = filter($scope.OrgDetailList, { OrgDetailsKey: $scope.EntityOrgDetail.OrgDetailsKey });
                if (!angular.isUndefined($scope.EntityOrgDetail.OrgDetailsType) && $scope.EntityOrgDetail.OrgDetailsType != null)
                    $scope.OrgDetailList = filter($scope.OrgDetailList, { OrgDetailsType: $scope.EntityOrgDetail.OrgDetailsType });
                $scope.OrgDetailList = filter($scope.OrgDetailList, { StrRoles: $scope.EntityOrgDetail.StrRoles });

                $scope.TotalCount = $scope.OrgDetailList.length;
                $scope.OrgDetailList = $scope.OrgDetailList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        };

        //PageIndexChange
        $scope.PageIndexChange = function (CurrPageIndex) {
            if ($scope.EntityList_LUserOrgDetailsVM.length > 0) {
                $scope.OrgDetailList = orderBy($scope.EntityList_LUserOrgDetailsVM, $scope.Sort, $scope.reverse);

                $scope.OrgDetailList = filter($scope.OrgDetailList, { OrgDetailsKey: $scope.EntityOrgDetail.OrgDetailsKey });
                if (!angular.isUndefined($scope.EntityOrgDetail.OrgDetailsType) && $scope.EntityOrgDetail.OrgDetailsType != null)
                    $scope.OrgDetailList = filter($scope.OrgDetailList, { OrgDetailsType: $scope.EntityOrgDetail.OrgDetailsType });
                $scope.OrgDetailList = filter($scope.OrgDetailList, { StrRoles: $scope.EntityOrgDetail.StrRoles });

                $scope.CurrPageIndex = CurrPageIndex;
                $scope.TotalCount = $scope.OrgDetailList.length;
                $scope.OrgDetailList = $scope.OrgDetailList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        }
    };

    LUOrgDetailsManageController.$inject = injectParams;

    angular.module("LoginModule").controller('LUOrgDetailsManageController', LUOrgDetailsManageController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Models/MsgBoxModel.js" />

(function () {
    'use strict';
    var injectParams_Config = ['CustomStateProvider'];

    var config = function (CustomStateProvider) {

        CustomStateProvider.AddState(Path.FunsPath, "LUOrganizationManage", "", {
            initData: ['WCFAuthInfoVM', 'OrgMgtSerClient', 'MsgBoxModel', function (WCFAuthInfoVM, OrgMgtSerClient, MsgBoxModel) {
                var msgBox = new MsgBoxModel();
                msgBox.OpenLoadingDialog();
                msgBoxTemp = msgBox;

                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return OrgMgtSerClient.GetEmptyOrgVM(wcfAuthInfoVM);
            }]
        });

        CustomStateProvider.AddState(Path.FunsPath, "LUOrganizationManage", "Edit", {
            initData: ['$stateParams', 'WCFAuthInfoVM', 'OrgMgtSerClient', function ($stateParams, WCFAuthInfoVM, OrgMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();
                wcfAuthInfoVM.SetFunKeyAndTypeKey("LUOrganizationManage", "Edit");

                var jsonData = {
                    entity_WCFAuthInfoVM: wcfAuthInfoVM,
                    str_OrgID: $stateParams.OrgID
                };

                return OrgMgtSerClient.GetEntityByID(jsonData);
            }]
        }, "/:OrgID");

        CustomStateProvider.AddState(Path.FunsPath, "LUOrganizationManage", "Create", {
            initData: ['WCFAuthInfoVM', 'OrgMgtSerClient', function (WCFAuthInfoVM, OrgMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return OrgMgtSerClient.GetEmptyOrgVM(wcfAuthInfoVM);
            }]
        });
    }
    config.$inject = injectParams_Config;

    angular.module("MainModule").config(config);

    var injectParams = ['$scope', '$q', '$filter', '$stateParams', '$location', '$sessionStorage', '$state', 'WCFAuthInfoVM', 'ClientSessionMgt', 'OrgMgtSerClient', 'CheckPrivilegeSerClient', 'WCFReturnResult', 'WCFErrorContract', 'MsgBoxModel'];

    var LUOrganizationManageController = function ($scope, $q, $filter, $stateParams, $location, $sessionStorage, $state, WCFAuthInfoVM, ClientSessionMgt, OrgMgtSerClient, CheckPrivilegeSerClient, WCFReturnResult, WCFErrorContract, MsgBoxModel) {
        var orderBy = $filter('orderBy');
        var filter = $filter('filter');

        var pageTitle = "";

        init();

        function GetOrgList(modelCriteria, ActionType) {
            var deferred = $q.defer();

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();
            wcfAuthInfoVM.SetFunKeyAndTypeKey("LUOrganizationManage", ActionType);

            modelCriteria.entity_WCFAuthInfoVM = wcfAuthInfoVM;

            OrgMgtSerClient.GetListWithPaging(modelCriteria).then(function (resp) {
                deferred.resolve(resp);
            }, function (resp) {
                deferred.reject(resp);
            });

            return deferred.promise;
        }

        function init() {
            var msgBox = msgBoxTemp;

            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                $scope.Captions = {
                    // Search and List Screen Resources
                    SearchCriteria: $sessionStorage.MultiLingualRes.SearchCriteria,
                    List: $sessionStorage.MultiLingualRes.List,
                    LUOrganizationManage_Create: $sessionStorage.MultiLingualRes.LUOrganizationManage_Create,
                    LUOrganizationManage_Edit: $sessionStorage.MultiLingualRes.LUOrganizationManage_Edit,
                    Operation: $sessionStorage.MultiLingualRes.Operation,
                    Delete: $sessionStorage.MultiLingualRes.Delete,
                    Edit: $sessionStorage.MultiLingualRes.Edit,
                    Search: $sessionStorage.MultiLingualRes.Search,
                    Save: $sessionStorage.MultiLingualRes.Save,

                    //Edit Resources
                    BacktoList: $sessionStorage.MultiLingualRes.BacktoList,

                    //Create Resources
                    OrganizationPath: $sessionStorage.MultiLingualRes.OrganizationPath,
                    OrganizationKey: $sessionStorage.MultiLingualRes.OrganizationKey,
                    OrganizationName: $sessionStorage.MultiLingualRes.OrganizationName,
                    OrganizationStatus: $sessionStorage.MultiLingualRes.OrganizationStatus,
                    Active: $sessionStorage.MultiLingualRes.Active,
                    InActive: $sessionStorage.MultiLingualRes.InActive,

                    //E019
                    E019: $sessionStorage.MultiLingualRes.E019
                };
                if ($state.includes("Main.LUOrganizationManage.Edit")) {
                    pageTitle = $sessionStorage.MultiLingualRes.LUOrganizationManage_Edit;
                }
                else if ($state.includes("Main.LUOrganizationManage.Create")) {
                    pageTitle = $sessionStorage.MultiLingualRes.LUOrganizationManage_Create;
                }
                else {
                    pageTitle = $sessionStorage.MultiLingualRes.LUOrganizationManage;
                }

                angular.element(window.document)[0].title = pageTitle;
            }

            var clientSessionMgt = new ClientSessionMgt();
            clientSessionMgt.PageTitle = pageTitle;
            var systemInfo = clientSessionMgt.GetSystemInfo();
            $scope.SystemInfo = systemInfo;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            if ($state.includes("Main.LUOrganizationManage.Edit")) {
                $scope.EditId = $stateParams.RoleID;

                var result_GetEntityByID = OrgMgtSerClient.GetEntityByID_Result();

                if (!angular.isUndefined(result_GetEntityByID) && result_GetEntityByID != null) {
                    var wcfReturnResult = new WCFReturnResult(result_GetEntityByID);
                    var strMsgs = wcfReturnResult.GetErrMsgs();
                    if (!wcfReturnResult.HasMsgs()) {
                        $scope.EntityOrg = wcfReturnResult.Entity_LUserOrganizationVM;
                    }
                    else {
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }

                    $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
                    $scope.PageSize = $scope.SystemInfo.PageSize;

                    $scope.msgBoxTitle = pageTitle;
                }
                msgBox.CloseLoadingDialog();
            }
            else if ($state.includes("Main.LUOrganizationManage.Create")) {
                var wcfReturnResult = new WCFReturnResult(OrgMgtSerClient.GetEmptyOrgVM_Result());
                var strMsgs = wcfReturnResult.GetErrMsgs();

                if (!wcfReturnResult.HasMsgs()) {
                    $scope.EntityOrg = wcfReturnResult.Entity_LUserOrganizationVM;
                }
                else {
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                }

                $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
                $scope.PageSize = $scope.SystemInfo.PageSize;

                $scope.msgBoxTitle = pageTitle;
                msgBox.CloseLoadingDialog();
            }
            else {
                $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
                $scope.PageSize = $scope.SystemInfo.PageSize;

                $scope.Sort = $scope.Sort || '';
                $scope.SortDir = $scope.SortDir || '';

                $scope.reverse = $scope.SortDir == "desc" ? true : false;

                var wcfReturnResult = new WCFReturnResult(OrgMgtSerClient.GetEmptyOrgVM_Result());
                var strMsgs = wcfReturnResult.GetErrMsgs();

                if (!wcfReturnResult.HasMsgs()) {
                    $scope.EntityOrg = wcfReturnResult.Entity_LUserOrganizationVM;

                    $scope.Sort = $scope.Sort || $scope.EntityOrg.DefaultSortColumn;
                    $scope.SortDir = $scope.SortDir || $scope.EntityOrg.DefaultSortDir;
                    $scope.reverse = $scope.SortDir == "desc" ? true : false;

                    var modelCriteria = {
                        'entity_WCFAuthInfoVM': undefined,
                        'entity_SearchCriteria': null,
                        'int_CurrentPage': 1,
                        'int_PageSize': 2147483647,//$scope.SystemInfo.PageSize,
                        'str_SortColumn': "",
                        'str_SortDir': "",
                        'str_CustomFilter': "",
                    };

                    var task = GetOrgList(modelCriteria, "View");

                    var wcfAuthInfoVM = new WCFAuthInfoVM();
                    wcfAuthInfoVM.initData();
                    wcfAuthInfoVM.SetFunKeyAndTypeKey("LUOrganizationManage", "Create");

                    var model_CheckPrivilege_Create = {
                        entity_WCFAuthInfoVM: wcfAuthInfoVM,
                        isCheckFunType: true
                    };

                    var task_CheckPrivilege_Create = CheckPrivilegeSerClient.CheckPrivilege(model_CheckPrivilege_Create);

                    $q.all([task, task_CheckPrivilege_Create]).then(function (resp) {
                        var wcfReturnResult = new WCFReturnResult(resp[0].data);

                        var result_CheckPrivilege_Create = resp[1].data;
                        $scope.CheckPrivilege_Create = result_CheckPrivilege_Create;

                        var strMsgs = wcfReturnResult.GetErrMsgs();

                        msgBox.CloseLoadingDialog();
                        if (!wcfReturnResult.HasMsgs()) {
                            $scope.EntityList_LUserOrganizationVM = wcfReturnResult.EntityList_LUserOrganizationVM;

                            $scope.OrgList = orderBy($scope.EntityList_LUserOrganizationVM, $scope.Sort, $scope.reverse);

                            $scope.OrgList = filter($scope.OrgList, { OrganizationPath: $scope.EntityOrg.OrganizationPath });
                            $scope.OrgList = filter($scope.OrgList, { OrganizationKey: $scope.EntityOrg.OrganizationKey });
                            $scope.OrgList = filter($scope.OrgList, { OrganizationName: $scope.EntityOrg.OrganizationName });

                            $scope.CurrPageIndex = 1;
                            $scope.TotalCount = $scope.OrgList.length;
                            $scope.OrgList = $scope.OrgList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
                        }
                        else {
                            throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                        }
                    }, function (resp) {
                        msgBox.CloseLoadingDialog();
                        var wcfErrorContract = new WCFErrorContract(resp.data);
                        throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
                    });
                }
                else {
                    msgBox.CloseLoadingDialog();
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                }
            }
        };

        $scope.Search = function () {
            if ($scope.EntityList_LUserOrganizationVM.length > 0) {
                $scope.OrgList = orderBy($scope.EntityList_LUserOrganizationVM, $scope.Sort, $scope.reverse);

                $scope.OrgList = filter($scope.OrgList, { OrganizationPath: $scope.EntityOrg.OrganizationPath });
                $scope.OrgList = filter($scope.OrgList, { OrganizationKey: $scope.EntityOrg.OrganizationKey });
                $scope.OrgList = filter($scope.OrgList, { OrganizationName: $scope.EntityOrg.OrganizationName });

                $scope.CurrPageIndex = 1;
                $scope.TotalCount = $scope.OrgList.length;
                $scope.OrgList = $scope.OrgList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        };

        //Delete
        $scope.Delete = function (OrgID) {
            pageTitle = $sessionStorage.MultiLingualRes.LUOrganizationManage_Delete;

            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("LUOrganizationManage", "Delete");

            var delModel = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                str_OrgID: OrgID
            };

            OrgMgtSerClient.Delete(delModel).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var result = new WCFReturnResult(resp.data);

                    if (!result.HasError()) {
                        if ($state.includes("Main.LUOrganizationManage.Edit")) {
                            $state.go("Main.LUOrganizationManage", {}, { reload: true });
                        }
                        else {
                            $state.reload();
                        }
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I001 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Edit
        $scope.Edit = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("LUOrganizationManage", "Edit");

            $scope.EntityOrg.EntityList_FDInfo = $scope.SpeFunDetailList;
            //$scope.EntityOrg.funDListJson = angular.toJson($scope.SpeFunDetailList);

            var jsonData = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                entity_OrgVM: $scope.EntityOrg
            };

            OrgMgtSerClient.Update(jsonData).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var wcfReturnResult = new WCFReturnResult(resp.data);
                    var strMsgs = wcfReturnResult.GetErrMsgs();

                    if (!wcfReturnResult.HasMsgs()) {
                        $state.reload();
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I000 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Create
        $scope.Create = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("LUOrganizationManage", "Create");

            $scope.EntityOrg.EntityList_FDInfo = $scope.SpeFunDetailList;
            //$scope.EntityOrg.funDListJson = angular.toJson($scope.SpeFunDetailList);

            var jsonData = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                entity_OrgVM: $scope.EntityOrg
            };

            OrgMgtSerClient.Create(jsonData).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var wcfReturnResult = new WCFReturnResult(resp.data);
                    var strMsgs = wcfReturnResult.GetErrMsgs();

                    if (!wcfReturnResult.HasMsgs()) {
                        $state.go("Main.LUOrganizationManage", {}, { reload: true });
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I000 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Sort By
        $scope.SortBy = function (sortCol) {
            $scope.reverse = true;
            if ($scope.Sort == sortCol) {
                $scope.SortDir = $scope.SortDir == "desc" ? "asc" : "desc";
                $scope.reverse = $scope.SortDir == "desc" ? true : false;
            }
            else {
                $scope.Sort = sortCol;
                $scope.SortDir = "asc";
                $scope.reverse = false;
            }

            if ($scope.EntityList_LUserOrganizationVM.length > 0) {

                $scope.OrgList = orderBy($scope.EntityList_LUserOrganizationVM, $scope.Sort, $scope.reverse);

                $scope.OrgList = filter($scope.OrgList, { OrganizationPath: $scope.EntityOrg.OrganizationPath });
                $scope.OrgList = filter($scope.OrgList, { OrganizationKey: $scope.EntityOrg.OrganizationKey });
                $scope.OrgList = filter($scope.OrgList, { OrganizationName: $scope.EntityOrg.OrganizationName });

                //$scope.CurrPageIndex = parseInt($scope.CurPageIndex) ;
                $scope.TotalCount = $scope.OrgList.length;
                $scope.OrgList = $scope.OrgList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        };

        //PageIndexChange
        $scope.PageIndexChange = function (CurrPageIndex) {
            if ($scope.EntityList_LUserOrganizationVM.length > 0) {
                $scope.OrgList = orderBy($scope.EntityList_LUserOrganizationVM, $scope.Sort, $scope.reverse);

                $scope.OrgList = filter($scope.OrgList, { OrganizationPath: $scope.EntityOrg.OrganizationPath });
                $scope.OrgList = filter($scope.OrgList, { OrganizationKey: $scope.EntityOrg.OrganizationKey });
                $scope.OrgList = filter($scope.OrgList, { OrganizationName: $scope.EntityOrg.OrganizationName });

                $scope.CurrPageIndex = CurrPageIndex;
                $scope.TotalCount = $scope.OrgList.length;
                $scope.OrgList = $scope.OrgList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        }
    };

    LUOrganizationManageController.$inject = injectParams;

    angular.module("LoginModule").controller('LUOrganizationManageController', LUOrganizationManageController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-cookies.js" />

(function () {
    'use strict';

    var injectParams_Config = ['CustomStateProvider'];

    var config = function (CustomStateProvider) {

        CustomStateProvider.AddState(Path.FunsPath, "LURoleManage", "", {
            initData: ['WCFAuthInfoVM', 'RoleMgtSerClient', 'MsgBoxModel', function (WCFAuthInfoVM, RoleMgtSerClient, MsgBoxModel) {
                var msgBox = new MsgBoxModel();
                msgBox.OpenLoadingDialog();
                msgBoxTemp = msgBox;

                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return RoleMgtSerClient.GetEmptyRoleVM(wcfAuthInfoVM);
            }]
        });

        CustomStateProvider.AddState(Path.FunsPath, "LURoleManage", "Edit", {
            initData: ['$stateParams', 'WCFAuthInfoVM', 'RoleMgtSerClient', function ($stateParams, WCFAuthInfoVM, RoleMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();
                wcfAuthInfoVM.SetFunKeyAndTypeKey("LURoleManage", "Edit");

                var jsonData = {
                    entity_WCFAuthInfoVM: wcfAuthInfoVM,
                    str_RoleID: $stateParams.RoleID
                };

                return RoleMgtSerClient.GetEntityByID(jsonData);
            }],
            initData_Funs: ['WCFAuthInfoVM', 'FunMgtSerClient', function (WCFAuthInfoVM, FunMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return FunMgtSerClient.GetAll(wcfAuthInfoVM);
            }],
            initData_GetPrivilegeByUserID: ['$stateParams', 'WCFAuthInfoVM', 'OrgDetailMgtSerClient', function ($stateParams, WCFAuthInfoVM, OrgDetailMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                var jsonData = {
                    entity_WCFAuthInfoVM: wcfAuthInfoVM,
                    str_ID: $stateParams.RoleID,
                    enum_RoleType: RoleType.Role
                };
                return OrgDetailMgtSerClient.GetPrivilegeByUserID(jsonData);
            }]
        }, "/:RoleID");


        CustomStateProvider.AddState(Path.FunsPath, "LURoleManage", "Create", {
            initData: ['WCFAuthInfoVM', 'RoleMgtSerClient', function (WCFAuthInfoVM, RoleMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return RoleMgtSerClient.GetEmptyRoleVM(wcfAuthInfoVM);
            }],
            initData_Funs: ['WCFAuthInfoVM', 'FunMgtSerClient', function (WCFAuthInfoVM, FunMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return FunMgtSerClient.GetAll(wcfAuthInfoVM);
            }]
        });
    }
    config.$inject = injectParams_Config;

    angular.module("MainModule").config(config);

    var injectParams = ['$scope', '$q', '$filter', '$stateParams', '$location', '$sessionStorage', '$state', 'WCFAuthInfoVM', 'ClientSessionMgt', 'FunMgtSerClient', 'RoleMgtSerClient', 'OrgDetailMgtSerClient', 'CheckPrivilegeSerClient', 'WCFReturnResult', 'WCFErrorContract', 'MsgBoxModel'];

    var LURoleManageController = function ($scope, $q, $filter, $stateParams, $location, $sessionStorage, $state, WCFAuthInfoVM, ClientSessionMgt, FunMgtSerClient, RoleMgtSerClient, OrgDetailMgtSerClient, CheckPrivilegeSerClient, WCFReturnResult, WCFErrorContract, MsgBoxModel) {
        var orderBy = $filter('orderBy');
        var filter = $filter('filter');

        var pageTitle = "";

        init();

        function GetRoleList(modelCriteria, ActionType) {
            var deferred = $q.defer();

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();
            wcfAuthInfoVM.SetFunKeyAndTypeKey("LURoleManage", ActionType);

            modelCriteria.entity_WCFAuthInfoVM = wcfAuthInfoVM;

            RoleMgtSerClient.GetListWithPaging(modelCriteria).then(function (resp) {
                deferred.resolve(resp);
            }, function (resp) {
                deferred.reject(resp);
            });

            return deferred.promise;
        }

        function init() {
            var msgBox = msgBoxTemp;

            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                $scope.Captions = {
                    // Search and List Screen Resources
                    SearchCriteria: $sessionStorage.MultiLingualRes.SearchCriteria,
                    List: $sessionStorage.MultiLingualRes.List,
                    LURoleManage_Create: $sessionStorage.MultiLingualRes.LURoleManage_Create,
                    LURoleManage_Edit: $sessionStorage.MultiLingualRes.LURoleManage_Edit,
                    Operation: $sessionStorage.MultiLingualRes.Operation,
                    Delete: $sessionStorage.MultiLingualRes.Delete,
                    Edit: $sessionStorage.MultiLingualRes.Edit,
                    Search: $sessionStorage.MultiLingualRes.Search,
                    Save: $sessionStorage.MultiLingualRes.Save,
                    AccessPrivilege: $sessionStorage.MultiLingualRes.AccessPrivilege,

                    RoleName: $sessionStorage.MultiLingualRes.RoleName,
                    CreateDate: $sessionStorage.MultiLingualRes.CreateDate,

                    //Edit Resources
                    BacktoList: $sessionStorage.MultiLingualRes.BacktoList,

                    //Create Resources
                    FunctionName: $sessionStorage.MultiLingualRes.FunctionName,
                    FunctionType: $sessionStorage.MultiLingualRes.FunctionType,
                    Add: $sessionStorage.MultiLingualRes.Add,

                    //E019
                    E019: $sessionStorage.MultiLingualRes.E019
                };
                if ($state.includes("Main.FManage.Edit")) {
                    pageTitle = $sessionStorage.MultiLingualRes.LURoleManage_Edit;
                }
                else if ($state.includes("Main.LURoleManage.Create")) {
                    pageTitle = $sessionStorage.MultiLingualRes.LURoleManage_Create;
                }
                else {
                    pageTitle = $sessionStorage.MultiLingualRes.LURoleManage;
                }

                angular.element(window.document)[0].title = pageTitle;
            }

            var clientSessionMgt = new ClientSessionMgt();
            clientSessionMgt.PageTitle = pageTitle;
            var systemInfo = clientSessionMgt.GetSystemInfo();
            $scope.SystemInfo = systemInfo;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            if ($state.includes("Main.LURoleManage.Edit")) {
                $scope.EditId = $stateParams.RoleID;

                var result_GetEntityByID = RoleMgtSerClient.GetEntityByID_Result();

                if (!angular.isUndefined(result_GetEntityByID) && result_GetEntityByID != null) {
                    var wcfReturnResult = new WCFReturnResult(result_GetEntityByID);
                    var strMsgs = wcfReturnResult.GetErrMsgs();
                    if (!wcfReturnResult.HasMsgs()) {
                        $scope.EntityRole = wcfReturnResult.Entity_LUserRoleVM;
                    }
                    else {
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }

                    $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
                    $scope.PageSize = $scope.SystemInfo.PageSize;

                    $scope.FunsList = FunMgtSerClient.GetAll_Result();

                    var result = OrgDetailMgtSerClient.GetPrivilegeByUserID_Result();

                    if (!angular.isUndefined(result) && result != null)
                        $scope.SpeFunDetailList = result;

                    $scope.msgBoxTitle = pageTitle;
                }
                msgBox.CloseLoadingDialog();
            }
            else if ($state.includes("Main.LURoleManage.Create")) {
                var wcfReturnResult = new WCFReturnResult(RoleMgtSerClient.GetEmptyRoleVM_Result());
                var strMsgs = wcfReturnResult.GetErrMsgs();

                if (!wcfReturnResult.HasMsgs()) {
                    $scope.EntityRole = wcfReturnResult.Entity_LUserRoleVM;
                }
                else {
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                }

                $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
                $scope.PageSize = $scope.SystemInfo.PageSize;

                $scope.FunsList = FunMgtSerClient.GetAll_Result();

                $scope.SpeFunDetailList = [];

                $scope.msgBoxTitle = pageTitle;

                msgBox.CloseLoadingDialog();
            }
            else {
                $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
                $scope.PageSize = $scope.SystemInfo.PageSize;

                $scope.DateTimeFormat = $scope.SystemInfo.DateFormat + " " + $scope.SystemInfo.TimeFormat;

                $scope.Sort = $scope.Sort || '';
                $scope.SortDir = $scope.SortDir || '';

                $scope.reverse = $scope.SortDir == "desc" ? true : false;

                var wcfReturnResult = new WCFReturnResult(RoleMgtSerClient.GetEmptyRoleVM_Result());
                var strMsgs = wcfReturnResult.GetErrMsgs();

                if (!wcfReturnResult.HasMsgs()) {
                    $scope.EntityRole = wcfReturnResult.Entity_LUserRoleVM;

                    $scope.Sort = $scope.Sort || $scope.EntityRole.DefaultSortColumn;
                    $scope.SortDir = $scope.SortDir || $scope.EntityRole.DefaultSortDir;
                    $scope.reverse = $scope.SortDir == "desc" ? true : false;

                    var modelCriteria = {
                        'entity_WCFAuthInfoVM': undefined,
                        'entity_SearchCriteria': null,
                        'int_CurrentPage': 1,
                        'int_PageSize': 2147483647,//$scope.SystemInfo.PageSize,
                        'str_SortColumn': "",
                        'str_SortDir': "",
                        'str_CustomFilter': "",
                    };

                    var task = GetRoleList(modelCriteria, "View");

                    var wcfAuthInfoVM = new WCFAuthInfoVM();
                    wcfAuthInfoVM.initData();
                    wcfAuthInfoVM.SetFunKeyAndTypeKey("LURoleManage", "Create");

                    var model_CheckPrivilege_Create = {
                        entity_WCFAuthInfoVM: wcfAuthInfoVM,
                        isCheckFunType: true
                    };

                    var task_CheckPrivilege_Create = CheckPrivilegeSerClient.CheckPrivilege(model_CheckPrivilege_Create);

                    $q.all([task, task_CheckPrivilege_Create]).then(function (resp) {
                        var wcfReturnResult = new WCFReturnResult(resp[0].data);

                        var result_CheckPrivilege_Create = resp[1].data;
                        $scope.CheckPrivilege_Create = result_CheckPrivilege_Create;

                        var strMsgs = wcfReturnResult.GetErrMsgs();

                        msgBox.CloseLoadingDialog();

                        if (!wcfReturnResult.HasMsgs()) {
                            for (var i = 0; i < wcfReturnResult.EntityList_LUserRoleVM.length; ++i) {
                                if (!angular.isUndefined(wcfReturnResult.EntityList_LUserRoleVM[i].CreateDate) && wcfReturnResult.EntityList_LUserRoleVM[i].CreateDate != null)
                                    wcfReturnResult.EntityList_LUserRoleVM[i].CreateDate = moment(wcfReturnResult.EntityList_LUserRoleVM[i].CreateDate).toDate();
                            }
                            $scope.EntityList_LUserRoleVM = wcfReturnResult.EntityList_LUserRoleVM;

                            $scope.RoleList = orderBy($scope.EntityList_LUserRoleVM, $scope.Sort, $scope.reverse);

                            $scope.RoleList = filter($scope.RoleList, { RoleName: $scope.EntityRole.RoleName });

                            $scope.CurrPageIndex = 1;
                            $scope.TotalCount = $scope.RoleList.length;
                            $scope.RoleList = $scope.RoleList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
                        }
                        else {
                            throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                        }
                    }, function (resp) {
                        msgBox.CloseLoadingDialog();
                        var wcfErrorContract = new WCFErrorContract(resp.data);
                        throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
                    });
                }
                else {
                    msgBox.CloseLoadingDialog();
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                }
            }
        };

        $scope.Search = function () {
            if ($scope.EntityList_LUserRoleVM.length > 0) {
                $scope.RoleList = orderBy($scope.EntityList_LUserRoleVM, $scope.Sort, $scope.reverse);

                $scope.RoleList = filter($scope.RoleList, { RoleName: $scope.EntityRole.RoleName });

                $scope.CurrPageIndex = 1;
                $scope.TotalCount = $scope.RoleList.length;
                $scope.RoleList = $scope.RoleList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        };

        //Delete
        $scope.Delete = function (RoleID) {
            pageTitle = $sessionStorage.MultiLingualRes.LURoleManage_Delete;
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("LURoleManage", "Delete");

            var delModel = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                str_RoleID: RoleID
            };

            RoleMgtSerClient.Delete(delModel).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var result = new WCFReturnResult(resp.data);

                    if (!result.HasError()) {
                        if ($state.includes("Main.LURoleManage.Edit")) {
                            $state.go("Main.LURoleManage", {}, { reload: true });
                        }
                        else {
                            $state.reload();
                        }
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I001 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Edit
        $scope.Edit = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("LURoleManage", "Edit");

            $scope.EntityRole.EntityList_FDInfo = $scope.SpeFunDetailList;
            //$scope.EntityRole.funDListJson = angular.toJson($scope.SpeFunDetailList);

            var jsonData = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                entity_RoleVM: $scope.EntityRole
            };

            RoleMgtSerClient.Update(jsonData).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var wcfReturnResult = new WCFReturnResult(resp.data);
                    var strMsgs = wcfReturnResult.GetErrMsgs();

                    if (!wcfReturnResult.HasMsgs()) {
                        $state.reload();
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I000 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Create
        $scope.Create = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("LURoleManage", "Create");

            $scope.EntityRole.EntityList_FDInfo = $scope.SpeFunDetailList;
            //$scope.EntityRole.funDListJson = angular.toJson($scope.SpeFunDetailList);

            var jsonData = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                entity_RoleVM: $scope.EntityRole
            };

            RoleMgtSerClient.Create(jsonData).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var wcfReturnResult = new WCFReturnResult(resp.data);
                    var strMsgs = wcfReturnResult.GetErrMsgs();

                    if (!wcfReturnResult.HasMsgs()) {
                        $state.go("Main.LURoleManage", {}, { reload: true });
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I000 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Sort By
        $scope.SortBy = function (sortCol) {
            $scope.reverse = true;
            if ($scope.Sort == sortCol) {
                $scope.SortDir = $scope.SortDir == "desc" ? "asc" : "desc";
                $scope.reverse = $scope.SortDir == "desc" ? true : false;
            }
            else {
                $scope.Sort = sortCol;
                $scope.SortDir = "asc";
                $scope.reverse = false;
            }

            if ($scope.EntityList_LUserRoleVM.length > 0) {

                $scope.RoleList = orderBy($scope.EntityList_LUserRoleVM, $scope.Sort, $scope.reverse);

                $scope.RoleList = filter($scope.RoleList, { RoleName: $scope.EntityRole.RoleName });

                //$scope.CurrPageIndex = parseInt($scope.CurPageIndex) ;
                $scope.TotalCount = $scope.RoleList.length;
                $scope.RoleList = $scope.RoleList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        };

        //PageIndexChange
        $scope.PageIndexChange = function (CurrPageIndex) {
            if ($scope.EntityList_LUserRoleVM.length > 0) {
                $scope.RoleList = orderBy($scope.EntityList_LUserRoleVM, $scope.Sort, $scope.reverse);

                $scope.RoleList = filter($scope.RoleList, { RoleName: $scope.EntityRole.RoleName });

                $scope.CurrPageIndex = CurrPageIndex;
                $scope.TotalCount = $scope.RoleList.length;
                $scope.RoleList = $scope.RoleList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        }
    };

    LURoleManageController.$inject = injectParams;

    angular.module("MainModule").controller('LURoleManageController', LURoleManageController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-cookies.js" />
/// <reference path="../Scripts/angular-route.js" />

(function () {
    'use strict';

    var injectParams_Config = ['$stateProvider', '$urlRouterProvider'];

    var config_Login = function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('LoginModule', {
                url: '/LoginModule',
                abstract: true,
            })
            .state('LoginModule.Login', {
                url: '/Login',
                views: {
                    '@': {
                        templateUrl: Path.AccControlLoginPath + 'Login.tpl.html',
                        controller: 'LoginController',
                        resolve: {
                            GetEmptyLoginUserVM: ['LoginUserMgtSer', function (LoginUserMgtSer) {
                                return LoginUserMgtSer.GetEmptyLoginUserVM();
                            }]
                        }
                    }
                }
            })
            .state('LoginModule.Reset', {
                url: '/Reset',
                views: {
                    '@': {
                        templateUrl: Path.AccControlLoginPath + 'Reset.tpl.html',
                        controller: 'LoginController',
                        resolve: {
                            GetEntityByID: ['$rootScope', 'LoginUserMgtSer', 'WCFAuthInfoVM', function ($rootScope, LoginUserMgtSer, WCFAuthInfoVM) {
                                var authInfoVM = new WCFAuthInfoVM();
                                //try {
                                authInfoVM.initData();
                                var model = {
                                    'entity_WCFAuthInfoVM': authInfoVM,
                                    'str_LUID': authInfoVM.GetUserId()
                                };

                                return LoginUserMgtSer.GetEntityByID(model);
                            }]
                        }
                    }
                }
            })
        ;
    }
    config_Login.$inject = injectParams_Config;

    angular.module("LoginModule").config(config_Login);

    var injectParams = ['$scope', '$state', '$q', '$sce', '$location', '$cookies', '$rootScope', '$sessionStorage', 'SystemInfoRestfulSer', 'LoginUserMgtSer', 'LoginUserModel', 'LUSerLoginResult', 'MsgBoxModel', 'ClientSessionMgt', 'WCFAuthInfoVM', 'WCFReturnResult'];

    var LoginController = function ($scope, $state, $q, $sce, $location, $cookies, $rootScope, $sessionStorage, SystemInfoRestfulSer, LoginUserMgtSer, LoginUserModel, LUSerLoginResult, MsgBoxModel, ClientSessionMgt, WCFAuthInfoVM, WCFReturnResult) {
        //------------------------------------------------------------------------Common Fun
        function redirectOtherPage(Path) {
            var path = '/' + Path;
            $location.replace();
            $location.path(path);
        };

        function setResource() {
            var tempPath = $location.path();

            //Login Box
            $scope.LoginBoxCaptions = {
                LoginBoxTitle: "",
                LoginNameCaption: "",
                LoginPwdCaption: "",
                LanguageCaption: "",
                LoginBtnCaption: ""
            };

            $scope.LoginBoxCaptions.LoginBoxTitle = $sessionStorage.MultiLingualRes.LoginScreenTitle;
            $scope.LoginBoxCaptions.LoginNameCaption = $sessionStorage.MultiLingualRes.LoginName;
            $scope.LoginBoxCaptions.LoginPwdCaption = $sessionStorage.MultiLingualRes.LoginPwd;
            $scope.LoginBoxCaptions.LanguageCaption = $sessionStorage.MultiLingualRes.Language;
            $scope.LoginBoxCaptions.LoginBtnCaption = $sce.trustAsHtml("      " + $sessionStorage.MultiLingualRes.Login);

            //Reset Box
            $scope.ResetBoxCaptions = {
                OriPwdCaption: "",
                NewPwdCaption: "",
                ConfirmNewPwdCaption: "",
                SaveBtnCaption: ""
            };

            $scope.ResetBoxCaptions.OriPwdCaption = $sessionStorage.MultiLingualRes.OriPwd;
            $scope.ResetBoxCaptions.NewPwdCaption = $sessionStorage.MultiLingualRes.NewPwd;
            $scope.ResetBoxCaptions.ConfirmNewPwdCaption = $sessionStorage.MultiLingualRes.ConfirmNewPwd;
            $scope.ResetBoxCaptions.SaveBtnCaption = $sessionStorage.MultiLingualRes.Save;

            if (tempPath == "/LoginModule/Login") {
                angular.element(window.document)[0].title = $sessionStorage.MultiLingualRes.LoginScreenTitle;
            }
            else if (tempPath == "/LoginModule/Reset") {
                angular.element(window.document)[0].title = $sessionStorage.MultiLingualRes.ResetPWDTitle;
            }

            $scope.LangPacks.SelectedKey.Key = $sessionStorage.SelectedLang;
        }

        function changeLang(langKey) {
            var systemInfoRequest = SystemInfoRestfulSer.GetMultiLingualResSer(langKey);
            systemInfoRequest.then(function (response) {
                var multiLignualRes = angular.fromJson(response.data);

                if (multiLignualRes != null && multiLignualRes != undefined) {
                    $sessionStorage.MultiLingualRes = multiLignualRes;
                    $sessionStorage.SelectedLang = langKey;
                    setResource();
                }
            });
        }
        //------------------------------------------------------------------------End

        //new ExceptionHelper();
        //------------------------------------------------------------------------Login Box
        init();

        function init() {
            $scope.LangPacks = {
                "Options": [
                    { Key: "en", Name: "English" },
                    { Key: "cn", Name: "简体中文" },
                    { Key: "tw", Name: "繁體中文" },
                    { Key: "esve", Name: "Español - Venezuela" }],
                "SelectedKey": { Key: "en", Name: "English" }
            };

            setResource();

            var tempPath = $location.path();

            if (tempPath == "/LoginModule/Reset") {
                var clientSessionMgt = new ClientSessionMgt();
                if (!angular.isUndefined($sessionStorage.MultiLingualRes)) {
                    clientSessionMgt.PageTitle = $sessionStorage.MultiLingualRes.ResetPWDTitle || "";
                    clientSessionMgt.MsgsStr = $sessionStorage.MultiLingualRes.E025 || "";
                }
                clientSessionMgt.GetUserInfo();

                $scope.LoginUserModel = LoginUserMgtSer.GetEntityByID_Result().Entity_LoginUserVM;
            }
            else if (tempPath == "/LoginModule/Login") {
                $scope.LoginUserModel = LoginUserMgtSer.GetEmptyLoginUserVM_Result();
            }
        };

        //Change Language
        $scope.ChangeLang = function (langKey) {
            changeLang(langKey);
        };

        //$scope.IsEnable_DoLogin = true;

        //Login Method
        $scope.DoLogin = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;
            //$scope.IsEnable_DoLogin = false;

            var model = {
                'entityInst': $scope.LoginUserModel,
                'str_Language': $scope.LangPacks.SelectedKey.Key,
                'str_IpAdd': "",
                'str_HostName': ""
            };
            var loginRequest = LoginUserMgtSer.Login(model);

            loginRequest.then(function (response) {
                var loginResult = new LUSerLoginResult(response.data);

                if (!loginResult.HasError()) {
                    var SessionInfo = {
                        'WCFToken': loginResult.Str_ServerToken,
                        'UserId': loginResult.Entity_SessionWUserInfo.ID
                    };

                    var clientSession = new ClientSessionMgt();

                    var request_SetUserInfo = clientSession.SetUserInfo(SessionInfo);

                    //$scope.IsEnable_DoLogin = true;
                    if (loginResult.PwdExpire()) {
                        //Reset Password
                        $state.go("LoginModule.Reset");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        $state.go('Main.Home.IndexPart1');
                        msgBox.CloseLoadingDialog();
                    }

                }
                else {
                    //$scope.IsEnable_DoLogin = true;
                    msgBox.CloseLoadingDialog();
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), $sessionStorage.MultiLingualRes.LoginScreenTitle, loginResult.GetErrMsgs());
                }
            });
        };
        //------------------------------------------------------------------------End

        //------------------------------------------------------------------------Reset Box
        $scope.IsEnable_Reset = true;
        $scope.Reset = function () {
            $scope.IsEnable_Reset = false;

            var authInfoVM = new WCFAuthInfoVM();
            authInfoVM.initData();

            $scope.LoginUserModel.ID = authInfoVM.GetUserId();

            var model = {
                'entity_WCFAuthInfoVM': authInfoVM,
                'entity_LUVM': $scope.LoginUserModel
            };

            LoginUserMgtSer.ResetPwd(model).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var result = new WCFReturnResult(resp.data);

                    if (!result.HasError()) {
                        $scope.IsEnable_Reset = true;
                        $state.go('Main.Home.IndexPart1');
                    }
                    else {
                        $scope.IsEnable_Reset = true;
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), $sessionStorage.MultiLingualRes.ResetPWDTitle, result.GetErrMsgs());
                    }
                }
            });
        };

        //------------------------------------------------------------------------End
    };

    LoginController.$inject = injectParams;

    angular.module("LoginModule").controller('LoginController', LoginController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Models/MsgBoxModel.js" />

(function () {
    'use strict';
    var injectParams_Config = ['CustomStateProvider'];

    var config = function (CustomStateProvider) {

        CustomStateProvider.AddState(Path.FunsPath, "LoginUserManage", "", {
            initData: ['WCFAuthInfoVM', 'LoginUserMgtSer', 'MsgBoxModel', function (WCFAuthInfoVM, LoginUserMgtSer, MsgBoxModel) {
                var msgBox = new MsgBoxModel();
                msgBox.OpenLoadingDialog();
                msgBoxTemp = msgBox;
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return LoginUserMgtSer.GetEmptyLoginUserVM(wcfAuthInfoVM);
            }],
            initAuthInfo: ['WCFAuthInfoVM', 'LoginUserMgtSer', function (WCFAuthInfoVM, LoginUserMgtSer) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();
                return LoginUserMgtSer.GetAuthInfo(wcfAuthInfoVM);
            }]
        });

        CustomStateProvider.AddState(Path.FunsPath, "LoginUserManage", "Edit", {
            initData: ['$stateParams', 'WCFAuthInfoVM', 'LoginUserMgtSer', function ($stateParams, WCFAuthInfoVM, LoginUserMgtSer) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();
                wcfAuthInfoVM.SetFunKeyAndTypeKey("LoginUserManage", "Edit");
                var jsonData = {
                    entity_WCFAuthInfoVM: wcfAuthInfoVM,
                    str_LUID: $stateParams.LUID
                };
                return LoginUserMgtSer.GetEntityByIDWDetails(jsonData);
            }],
            initData_Funs: ['WCFAuthInfoVM', 'FunMgtSerClient', function (WCFAuthInfoVM, FunMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return FunMgtSerClient.GetAll(wcfAuthInfoVM);
            }],
            initData_Roles: ['WCFAuthInfoVM', 'RoleMgtSerClient', function (WCFAuthInfoVM, RoleMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return RoleMgtSerClient.GetAll(wcfAuthInfoVM);
            }],
            initData_Orgs: ['WCFAuthInfoVM', 'OrgMgtSerClient', function (WCFAuthInfoVM, OrgMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return OrgMgtSerClient.GetAll(wcfAuthInfoVM);
            }],
            initData_OrgDetails: ['WCFAuthInfoVM', 'OrgDetailMgtSerClient', function (WCFAuthInfoVM, OrgDetailMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return OrgDetailMgtSerClient.GetAll(wcfAuthInfoVM);
            }],
            initAuthInfo: ['WCFAuthInfoVM', 'LoginUserMgtSer', function (WCFAuthInfoVM, LoginUserMgtSer) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();
                return LoginUserMgtSer.GetAuthInfo(wcfAuthInfoVM);
            }]
        }, "/:LUID");

        CustomStateProvider.AddState(Path.FunsPath, "LoginUserManage", "Create", {
            initData: ['WCFAuthInfoVM', 'LoginUserMgtSer', function (WCFAuthInfoVM, LoginUserMgtSer) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return LoginUserMgtSer.GetEmptyLoginUserVM(wcfAuthInfoVM);
            }],
            initData_Funs: ['WCFAuthInfoVM', 'FunMgtSerClient', function (WCFAuthInfoVM, FunMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return FunMgtSerClient.GetAll(wcfAuthInfoVM);
            }],
            initData_Roles: ['WCFAuthInfoVM', 'RoleMgtSerClient', function (WCFAuthInfoVM, RoleMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return RoleMgtSerClient.GetAll(wcfAuthInfoVM);
            }],
            initData_Orgs: ['WCFAuthInfoVM', 'OrgMgtSerClient', function (WCFAuthInfoVM, OrgMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return OrgMgtSerClient.GetAll(wcfAuthInfoVM);
            }],
            initData_OrgDetails: ['WCFAuthInfoVM', 'OrgDetailMgtSerClient', function (WCFAuthInfoVM, OrgDetailMgtSerClient) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();

                return OrgDetailMgtSerClient.GetAll(wcfAuthInfoVM);
            }],
            initAuthInfo: ['WCFAuthInfoVM', 'LoginUserMgtSer', function (WCFAuthInfoVM, LoginUserMgtSer) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();
                return LoginUserMgtSer.GetAuthInfo(wcfAuthInfoVM);
            }]
        });
    }
    config.$inject = injectParams_Config;

    angular.module("MainModule").config(config);

    var injectParams = ['$scope', '$q', '$filter', '$stateParams', '$location', '$sessionStorage', '$state', 'WCFAuthInfoVM', 'ClientSessionMgt', 'LoginUserMgtSer', 'FunMgtSerClient', 'RoleMgtSerClient', 'OrgMgtSerClient', 'OrgDetailMgtSerClient', 'CheckPrivilegeSerClient', 'WCFReturnResult', 'WCFErrorContract', 'MsgBoxModel'];

    var LoginUserManageController = function ($scope, $q, $filter, $stateParams, $location, $sessionStorage, $state, WCFAuthInfoVM, ClientSessionMgt, LoginUserMgtSer, FunMgtSerClient, RoleMgtSerClient, OrgMgtSerClient, OrgDetailMgtSerClient, CheckPrivilegeSerClient, WCFReturnResult, WCFErrorContract, MsgBoxModel) {
        var orderBy = $filter('orderBy');
        var filter = $filter('filter');

        var pageTitle = "";

        init();

        function GetLoginUserList(modelCriteria, ActionType) {
            var deferred = $q.defer();

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();
            wcfAuthInfoVM.SetFunKeyAndTypeKey("LoginUserManage", ActionType);

            var result_SessionWUserInfo = LoginUserMgtSer.GetAuthInfo_Result();

            var entity_FunDetailInfo = null;
            if (!angular.isUndefined(result_SessionWUserInfo) && result_SessionWUserInfo != null) {
                angular.forEach(result_SessionWUserInfo.EntityList_FDInfo, function (value, key) {
                    if (value.FKey == "LoginUserManage") {
                        entity_FunDetailInfo = value;
                        return;
                    }
                });
            }

            var strList_Path = [];

            if (entity_FunDetailInfo != null) {
                if (entity_FunDetailInfo.FTName.indexOf(ActionType) > -1) {
                    //Specific Organization Settings
                    if (entity_FunDetailInfo.OrgPath.length > 0) {
                        var fdIndex = entity_FunDetailInfo.FTName.indexOf(ActionType);

                        if (entity_FunDetailInfo.FDSelected[fdIndex]) {

                            angular.forEach(entity_FunDetailInfo.OrgPath[fdIndex].Value, function (value, key) {
                                strList_Path.push(value);
                            });
                        }
                    }
                }
            }

            modelCriteria.entity_WCFAuthInfoVM = wcfAuthInfoVM;

            var model = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                strList_OrgPath: strList_Path
            };

            LoginUserMgtSer.GetLUIDList(model).then(function (resp) {
                modelCriteria.guidList_AccessedLUserID = resp.data;
                LoginUserMgtSer.GetListWithPaging(modelCriteria).then(function (resp) {
                    deferred.resolve(resp);
                }, function (resp) {
                    deferred.reject(resp);
                });
            });

            return deferred.promise;
        }

        function init() {
            var msgBox = msgBoxTemp;
            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                $scope.Captions = {
                    // Search and List Screen Resources
                    SearchCriteria: $sessionStorage.MultiLingualRes.SearchCriteria,
                    List: $sessionStorage.MultiLingualRes.List,
                    LoginUserManage_Create: $sessionStorage.MultiLingualRes.LoginUserManage_Create,
                    LoginUserManage_Edit: $sessionStorage.MultiLingualRes.LoginUserManage_Edit,
                    Operation: $sessionStorage.MultiLingualRes.Operation,
                    Delete: $sessionStorage.MultiLingualRes.Delete,
                    Edit: $sessionStorage.MultiLingualRes.Edit,
                    Search: $sessionStorage.MultiLingualRes.Search,
                    Save: $sessionStorage.MultiLingualRes.Save,
                    CreateDate: $sessionStorage.MultiLingualRes.CreateDate,
                    LastLoginDT: $sessionStorage.MultiLingualRes.LastLoginDT,

                    RoleName: $sessionStorage.MultiLingualRes.RoleName,
                    OrganizationKey: $sessionStorage.MultiLingualRes.OrganizationKey,

                    //Edit Resources
                    BacktoList: $sessionStorage.MultiLingualRes.BacktoList,
                    Reset: $sessionStorage.MultiLingualRes.Reset,

                    //Create Resources
                    LoginName: $sessionStorage.MultiLingualRes.LoginName,
                    UserType: $sessionStorage.MultiLingualRes.UserType,
                    LoginPwd: $sessionStorage.MultiLingualRes.LoginPwd,
                    LoginConfirmPwd: $sessionStorage.MultiLingualRes.LoginConfirmPwd,
                    Status: $sessionStorage.MultiLingualRes.Status,
                    Active: $sessionStorage.MultiLingualRes.Active,
                    InActive: $sessionStorage.MultiLingualRes.InActive,
                    Suspend: $sessionStorage.MultiLingualRes.Suspend,
                    NormalUserID: $sessionStorage.MultiLingualRes.NormalUserID,

                    All: $sessionStorage.MultiLingualRes.All,
                    SpecificFunctions: $sessionStorage.MultiLingualRes.SpecificFunctions,
                    AsRoleSetting: $sessionStorage.MultiLingualRes.AsRoleSetting,
                    AsOrgSetting: $sessionStorage.MultiLingualRes.AsOrgSetting,

                    //E019
                    E019: $sessionStorage.MultiLingualRes.E019
                };
                if ($state.includes("Main.LoginUserManage.Edit")) {
                    pageTitle = $sessionStorage.MultiLingualRes.LoginUserManage_Edit;
                }
                else if ($state.includes("Main.LoginUserManage.Create")) {
                    pageTitle = $sessionStorage.MultiLingualRes.LoginUserManage_Create;
                }
                else {
                    pageTitle = $sessionStorage.MultiLingualRes.LoginUserManage;
                }

                angular.element(window.document)[0].title = pageTitle;
            }

            var clientSessionMgt = new ClientSessionMgt();
            clientSessionMgt.PageTitle = pageTitle;
            var systemInfo = clientSessionMgt.GetSystemInfo();
            $scope.SystemInfo = systemInfo;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            if ($state.includes("Main.LoginUserManage.Edit")) {
                $scope.EditId = $stateParams.LUID;

                var result_GetEntityByID = LoginUserMgtSer.GetEntityByIDWDetails_Result();

                if (!angular.isUndefined(result_GetEntityByID) && result_GetEntityByID != null) {
                    var wcfReturnResult = new WCFReturnResult(result_GetEntityByID);
                    var strMsgs = wcfReturnResult.GetErrMsgs();
                    if (!wcfReturnResult.HasMsgs()) {
                        $scope.EntityLoginUser = wcfReturnResult.Entity_LoginUserVM;
                    }
                    else {
                        throw new ExcetionInst(ExceptionType.AccessDenied, $location.path(), pageTitle, strMsgs);
                    }

                    $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
                    $scope.PageSize = $scope.SystemInfo.PageSize;

                    $scope.FunsList = FunMgtSerClient.GetAll_Result();

                    $scope.RolesList = RoleMgtSerClient.GetAll_Result();

                    var entityList_OrgVM = OrgMgtSerClient.GetAll_Result();

                    var result_SessionWUserInfo = LoginUserMgtSer.GetAuthInfo_Result();

                    var entityList_OrgVM = LoginUserMgtSer.GetOrgIDList(result_SessionWUserInfo, "LoginUserManage", "Edit", entityList_OrgVM);

                    $scope.UserType = result_SessionWUserInfo.UserType;

                    $scope.OrgList = entityList_OrgVM;

                    $scope.OrgDetailList = OrgDetailMgtSerClient.GetAll_Result();

                    if ($scope.EntityLoginUser.UserType == 1) {
                        var result = $scope.EntityLoginUser.EntityList_FDInfo;
                        if (!angular.isUndefined(result) && result != null)
                            $scope.SpeFunDetailList = result;
                        $scope.SpeRoleDetailList = [];
                        $scope.OrgSettingList = [];
                    }
                    else if ($scope.EntityLoginUser.UserType == 2) {
                        var roleListIDList = $scope.EntityLoginUser.roleListIDList;
                        var roleID_Array = roleListIDList.split("|");

                        $scope.SpeRoleDetailList = [];

                        angular.forEach(roleID_Array, function (roleID, key_roleID) {
                            angular.forEach($scope.RolesList, function (roleObj, key_roleObj) {
                                if (roleObj.ID == roleID) {
                                    $scope.SpeRoleDetailList.push(roleObj);
                                }
                            });
                        });
                        $scope.SpeFunDetailList = [];
                        $scope.OrgSettingList = [];
                    }
                    else if ($scope.EntityLoginUser.UserType == 3) {
                        var orgListIDList = $scope.EntityLoginUser.orgListIDList;
                        var orgDetailsIDList = $scope.EntityLoginUser.orgDetailsIDList;

                        $scope.OrgSettingList = [];

                        if (!angular.isUndefined(orgListIDList) && orgListIDList != null && !angular.isUndefined(orgDetailsIDList) && orgDetailsIDList != null) {
                            var orgID_Array = orgListIDList.split("|");
                            var orgDetailID_Array = orgDetailsIDList.split("|");

                            angular.forEach(orgID_Array, function (orgID, key_orgID) {
                                angular.forEach($scope.OrgList, function (orgObj, key_orgObj) {
                                    if (orgObj.ID == orgID) {
                                        var model = {};
                                        model.Org_ID = orgObj.ID;
                                        model.Org_Path = orgObj.OrganizationPath;
                                        model.Org_Key = orgObj.OrganizationKey;
                                        model.Org_Name = orgObj.OrganizationName;
                                        model.Org_AllowEdit = orgObj.AllowEdit;
                                        model.Org_AllowDel = orgObj.AllowDel;
                                        $scope.OrgSettingList.push(model);
                                    }
                                });
                            });

                            angular.forEach(orgDetailID_Array, function (orgDetailID, key_orgID) {
                                angular.forEach($scope.OrgDetailList, function (orgDetailObj, key_orgObj) {
                                    if (orgDetailObj.ID == orgDetailID) {
                                        var model_OrgSetting = $scope.OrgSettingList[key_orgID];
                                        model_OrgSetting.OrgDetail_ID = orgDetailObj.ID;
                                        model_OrgSetting.OrgDetail_Key = orgDetailObj.OrgDetailsKey;
                                        model_OrgSetting.OrgDetail_Type = orgDetailObj.OrgDetailsType;
                                        model_OrgSetting.OrgDetail_TypeName = orgDetailObj.OrgDetailsTypeName;
                                        model_OrgSetting.OrgDetail_AllowEdit = orgDetailObj.AllowEdit;
                                        model_OrgSetting.OrgDetail_AllowDel = orgDetailObj.AllowDel;
                                    }
                                });
                            });
                        }

                        $scope.SpeRoleDetailList = [];
                        $scope.SpeFunDetailList = [];
                    }

                    $scope.msgBoxTitle = pageTitle;
                }
                msgBox.CloseLoadingDialog();
            }
            else if ($state.includes("Main.LoginUserManage.Create")) {
                var wcfReturnResult = new WCFReturnResult(LoginUserMgtSer.GetEmptyLoginUserVM_Result());
                var strMsgs = wcfReturnResult.GetErrMsgs();

                if (!wcfReturnResult.HasMsgs()) {
                    $scope.EntityLoginUser = wcfReturnResult;
                    $scope.EntityLoginUser.Status = 1;
                    $scope.EntityLoginUser.UserType = 1;
                }
                else {
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                }

                $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
                $scope.PageSize = $scope.SystemInfo.PageSize;

                $scope.FunsList = FunMgtSerClient.GetAll_Result();

                $scope.SpeFunDetailList = [];

                $scope.RolesList = RoleMgtSerClient.GetAll_Result();

                $scope.SpeRoleDetailList = [];

                $scope.OrgSettingList = [];

                var entityList_OrgVM = OrgMgtSerClient.GetAll_Result();

                var result_SessionWUserInfo = LoginUserMgtSer.GetAuthInfo_Result();

                $scope.UserType = result_SessionWUserInfo.UserType;

                if ($scope.UserType == 3) {
                    $scope.EntityLoginUser.UserType = result_SessionWUserInfo.UserType;
                }

                var entityList_OrgVM = LoginUserMgtSer.GetOrgIDList(result_SessionWUserInfo, "LoginUserManage", "Create", entityList_OrgVM);

                $scope.OrgList = entityList_OrgVM;

                $scope.OrgDetailList = OrgDetailMgtSerClient.GetAll_Result();

                $scope.msgBoxTitle = pageTitle;

                msgBox.CloseLoadingDialog();
            }
            else {
                $scope.DisplayPageNum = $scope.SystemInfo.DisplayPageNum;
                $scope.PageSize = $scope.SystemInfo.PageSize;

                $scope.DateTimeFormat = $scope.SystemInfo.DateFormat + " " + $scope.SystemInfo.TimeFormat;

                $scope.Sort = $scope.Sort || '';
                $scope.SortDir = $scope.SortDir || '';

                $scope.reverse = $scope.SortDir == "desc" ? true : false;

                var result_SessionWUserInfo = LoginUserMgtSer.GetAuthInfo_Result();

                $scope.UserType = result_SessionWUserInfo.UserType;

                var wcfReturnResult = new WCFReturnResult(LoginUserMgtSer.GetEmptyLoginUserVM_Result());
                var strMsgs = wcfReturnResult.GetErrMsgs();

                if (!wcfReturnResult.HasMsgs()) {
                    $scope.EntityLoginUser = wcfReturnResult;
                    if ($scope.UserType == 3) {
                        $scope.EntityLoginUser.UserType = result_SessionWUserInfo.UserType;
                    }
                    $scope.Sort = $scope.Sort || $scope.EntityLoginUser.DefaultSortColumn;
                    $scope.SortDir = $scope.SortDir || $scope.EntityLoginUser.DefaultSortDir;
                    $scope.reverse = $scope.SortDir == "desc" ? true : false;

                    var modelCriteria = {
                        'entity_WCFAuthInfoVM': undefined,
                        'entity_SearchCriteria': null,
                        'int_CurrentPage': 1,
                        'int_PageSize': 2147483647,//$scope.SystemInfo.PageSize,
                        'str_SortColumn': "",
                        'str_SortDir': "",
                        'str_CustomFilter': "",
                        'guidList_AccessedLUserID': []
                    };

                    var task = GetLoginUserList(modelCriteria, "View");

                    var wcfAuthInfoVM = new WCFAuthInfoVM();
                    wcfAuthInfoVM.initData();
                    wcfAuthInfoVM.SetFunKeyAndTypeKey("LoginUserManage", "Create");

                    var model_CheckPrivilege_Create = {
                        entity_WCFAuthInfoVM: wcfAuthInfoVM,
                        isCheckFunType: true
                    };

                    var task_CheckPrivilege_Create = CheckPrivilegeSerClient.CheckPrivilege(model_CheckPrivilege_Create);

                    $q.all([task, task_CheckPrivilege_Create]).then(function (resp) {
                        var wcfReturnResult = new WCFReturnResult(resp[0].data);
                        var result_CheckPrivilege_Create = resp[1].data;
                        $scope.CheckPrivilege_Create = result_CheckPrivilege_Create;

                        var strMsgs = wcfReturnResult.GetErrMsgs();

                        msgBox.CloseLoadingDialog();
                        if (!wcfReturnResult.HasMsgs()) {
                            for (var i = 0; i < wcfReturnResult.EntityList_LoginUserVM.length; ++i) {
                                if (!angular.isUndefined(wcfReturnResult.EntityList_LoginUserVM[i].CreateDate) && wcfReturnResult.EntityList_LoginUserVM[i].CreateDate != null)
                                    wcfReturnResult.EntityList_LoginUserVM[i].CreateDate = moment(wcfReturnResult.EntityList_LoginUserVM[i].CreateDate).toDate();
                                if (!angular.isUndefined(wcfReturnResult.EntityList_LoginUserVM[i].LastLoginDT) && wcfReturnResult.EntityList_LoginUserVM[i].LastLoginDT != null)
                                    wcfReturnResult.EntityList_LoginUserVM[i].LastLoginDT = moment(wcfReturnResult.EntityList_LoginUserVM[i].LastLoginDT).toDate();
                            }

                            $scope.EntityList_LoginUserVM = wcfReturnResult.EntityList_LoginUserVM;

                            $scope.LoginUserList = orderBy($scope.EntityList_LoginUserVM, $scope.Sort, $scope.reverse);

                            if (!angular.isUndefined($scope.EntityLoginUser.UserType) && $scope.EntityLoginUser.UserType != null)
                                $scope.LoginUserList = filter($scope.LoginUserList, { UserType: $scope.EntityLoginUser.UserType });
                            $scope.LoginUserList = filter($scope.LoginUserList, { LoginName: $scope.EntityLoginUser.LoginName });
                            $scope.LoginUserList = filter($scope.LoginUserList, { StrRoles: $scope.EntityLoginUser.StrRoles });
                            $scope.LoginUserList = filter($scope.LoginUserList, { StrOrgs: $scope.EntityLoginUser.StrOrgs });

                            $scope.CurrPageIndex = 1;
                            $scope.TotalCount = $scope.LoginUserList.length;
                            $scope.LoginUserList = $scope.LoginUserList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
                        }
                        else {
                            throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                        }
                    }, function (resp) {
                        msgBox.CloseLoadingDialog();
                        var wcfErrorContract = new WCFErrorContract(resp.data);
                        throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
                    });
                }
                else {
                    msgBox.CloseLoadingDialog();
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                }
            }
        };

        $scope.Search = function () {
            if ($scope.EntityList_LoginUserVM.length > 0) {
                $scope.LoginUserList = orderBy($scope.EntityList_LoginUserVM, $scope.Sort, $scope.reverse);

                if (!angular.isUndefined($scope.EntityLoginUser.UserType) && $scope.EntityLoginUser.UserType != null)
                    $scope.LoginUserList = filter($scope.LoginUserList, { UserType: $scope.EntityLoginUser.UserType });
                $scope.LoginUserList = filter($scope.LoginUserList, { LoginName: $scope.EntityLoginUser.LoginName });
                $scope.LoginUserList = filter($scope.LoginUserList, { StrRoles: $scope.EntityLoginUser.StrRoles });
                $scope.LoginUserList = filter($scope.LoginUserList, { StrOrgs: $scope.EntityLoginUser.StrOrgs });

                $scope.CurrPageIndex = 1;
                $scope.TotalCount = $scope.LoginUserList.length;
                $scope.LoginUserList = $scope.LoginUserList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        };

        $scope.isChangePwd = false;

        //Reset Button
        $scope.ClickChangePwd = function () {
            $scope.isChangePwd = !$scope.isChangePwd;
        };

        //Delete
        $scope.Delete = function (LUID) {
            pageTitle = $sessionStorage.MultiLingualRes.LoginUserManage_Delete;

            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("LoginUserManage", "Delete");

            var delModel = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                str_LUID: LUID
            };

            LoginUserMgtSer.Delete(delModel).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var result = new WCFReturnResult(resp.data);

                    if (!result.HasError()) {
                        if ($state.includes("Main.LoginUserManage.Edit")) {
                            $state.go("Main.LoginUserManage", {}, { reload: true });
                        }
                        else {
                            $state.reload();
                        }
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I001 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, result.GetErrMsgs());
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Edit
        $scope.Edit = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("LoginUserManage", "Edit");

            $scope.EntityLoginUser.isChangePwd = $scope.isChangePwd;

            if ($scope.EntityLoginUser.UserType == 1) {
                $scope.EntityLoginUser.EntityList_FDInfo = $scope.SpeFunDetailList;
            }
            else if ($scope.EntityLoginUser.UserType == 2) {
                $scope.EntityLoginUser.EntityList_Role = $scope.SpeRoleDetailList;
            }
            else if ($scope.EntityLoginUser.UserType == 3) {
                var orgID_Array = [];
                var orgDetailID_Array = [];
                angular.forEach($scope.OrgSettingList, function (value, key) {
                    orgID_Array.push(value.Org_ID);
                    orgDetailID_Array.push(value.OrgDetail_ID);
                });
                $scope.EntityLoginUser.orgListIDList = orgID_Array.join("|");
                $scope.EntityLoginUser.orgDetailsIDList = orgDetailID_Array.join("|");
            }

            var jsonData = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                entity_LUVM: $scope.EntityLoginUser
            };

            LoginUserMgtSer.Update(jsonData).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var wcfReturnResult = new WCFReturnResult(resp.data);
                    var strMsgs = wcfReturnResult.GetErrMsgs();

                    if (!wcfReturnResult.HasMsgs()) {
                        $state.reload();
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I000 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Create
        $scope.Create = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            wcfAuthInfoVM.SetFunKeyAndTypeKey("LoginUserManage", "Create");

            if ($scope.EntityLoginUser.UserType == 1) {
                $scope.EntityLoginUser.EntityList_FDInfo = $scope.SpeFunDetailList;
            }
            else if ($scope.EntityLoginUser.UserType == 2) {
                $scope.EntityLoginUser.EntityList_Role = $scope.SpeRoleDetailList;
            }
            else if ($scope.EntityLoginUser.UserType == 3) {
                var orgID_Array = [];
                var orgDetailID_Array = [];
                angular.forEach($scope.OrgSettingList, function (value, key) {
                    orgID_Array.push(value.Org_ID);
                    orgDetailID_Array.push(value.OrgDetail_ID);
                });
                $scope.EntityLoginUser.orgListIDList = orgID_Array.join("|");
                $scope.EntityLoginUser.orgDetailsIDList = orgDetailID_Array.join("|");
            }

            var jsonData = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                entity_LUVM: $scope.EntityLoginUser
            };

            LoginUserMgtSer.Create(jsonData).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var wcfReturnResult = new WCFReturnResult(resp.data);
                    var strMsgs = wcfReturnResult.GetErrMsgs();

                    if (!wcfReturnResult.HasMsgs()) {
                        $state.go("Main.LoginUserManage", {}, { reload: true });
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, pageTitle || "", $sessionStorage.MultiLingualRes.I000 || "");
                        msgBox.CloseLoadingDialog();
                    }
                    else {
                        msgBox.CloseLoadingDialog();
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), pageTitle, strMsgs);
                    }
                }
            }, function (resp) {
                msgBox.CloseLoadingDialog();
                var wcfErrorContract = new WCFErrorContract(resp.data);
                throw new ExcetionInst(ExceptionType.RestServiceError, $location.path(), pageTitle, wcfErrorContract.StrMsg, wcfErrorContract.StrTraceMsg);
            });
        };

        //Sort By
        $scope.SortBy = function (sortCol) {
            $scope.reverse = true;
            if ($scope.Sort == sortCol) {
                $scope.SortDir = $scope.SortDir == "desc" ? "asc" : "desc";
                $scope.reverse = $scope.SortDir == "desc" ? true : false;
            }
            else {
                $scope.Sort = sortCol;
                $scope.SortDir = "asc";
                $scope.reverse = false;
            }

            if ($scope.EntityList_LoginUserVM.length > 0) {

                $scope.LoginUserList = orderBy($scope.EntityList_LoginUserVM, $scope.Sort, $scope.reverse);

                if (!angular.isUndefined($scope.EntityLoginUser.UserType) && $scope.EntityLoginUser.UserType != null)
                    $scope.LoginUserList = filter($scope.LoginUserList, { UserType: $scope.EntityLoginUser.UserType });
                $scope.LoginUserList = filter($scope.LoginUserList, { LoginName: $scope.EntityLoginUser.LoginName });
                $scope.LoginUserList = filter($scope.LoginUserList, { StrRoles: $scope.EntityLoginUser.StrRoles });
                $scope.LoginUserList = filter($scope.LoginUserList, { StrOrgs: $scope.EntityLoginUser.StrOrgs });

                //$scope.CurrPageIndex = parseInt($scope.CurPageIndex) ;
                $scope.TotalCount = $scope.LoginUserList.length;
                $scope.LoginUserList = $scope.LoginUserList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        };

        //PageIndexChange
        $scope.PageIndexChange = function (CurrPageIndex) {
            if ($scope.EntityList_LoginUserVM.length > 0) {
                $scope.LoginUserList = orderBy($scope.EntityList_LoginUserVM, $scope.Sort, $scope.reverse);

                if (!angular.isUndefined($scope.EntityLoginUser.UserType) && $scope.EntityLoginUser.UserType != null)
                    $scope.LoginUserList = filter($scope.LoginUserList, { UserType: $scope.EntityLoginUser.UserType });
                $scope.LoginUserList = filter($scope.LoginUserList, { LoginName: $scope.EntityLoginUser.LoginName });
                $scope.LoginUserList = filter($scope.LoginUserList, { StrRoles: $scope.EntityLoginUser.StrRoles });
                $scope.LoginUserList = filter($scope.LoginUserList, { StrOrgs: $scope.EntityLoginUser.StrOrgs });

                $scope.CurrPageIndex = CurrPageIndex;
                $scope.TotalCount = $scope.LoginUserList.length;
                $scope.LoginUserList = $scope.LoginUserList.slice($scope.PageSize * ($scope.CurrPageIndex - 1), $scope.PageSize * $scope.CurrPageIndex);
            }
        }
    };

    LoginUserManageController.$inject = injectParams;

    angular.module("LoginModule").controller('LoginUserManageController', LoginUserManageController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-route.js" />

(function () {
    'use strict';

    var injectParams_Config = ['$stateProvider', '$urlRouterProvider', 'CustomStateProvider'];

    var config_Main = function ($stateProvider, $urlRouterProvider, CustomStateProvider) {
        $stateProvider
            .state('Main', {
                url: '/Main',
                views: {
                    '@': {
                        templateUrl: Path.MainPath + 'Main.tpl.html',
                        controller: 'MainController'
                    }
                },
                resolve: {
                    GetMenuByAuthInfo: ['$rootScope', 'FunMgtSerClient', 'WCFAuthInfoVM', function ($rootScope, FunMgtSerClient, WCFAuthInfoVM) {
                        var wcfAuthInfoVM = new WCFAuthInfoVM();
                        wcfAuthInfoVM.initData();
                        return FunMgtSerClient.GetMenuByAuthInfo(wcfAuthInfoVM);
                    }]
                }
            });
    }
    config_Main.$inject = injectParams_Config;

    angular.module("MainModule").config(config_Main);

    var injectParams_MainController = ['$scope', '$state', '$sessionStorage', '$location', 'CustomState', 'FunMgtSerClient', 'WCFAuthInfoVM', 'LoginUserMgtSer', 'WCFReturnResult', 'ClientSessionMgt', 'MsgBoxModel'];

    var MainController = function ($scope, $state, $sessionStorage, $location, CustomState, FunMgtSerClient, WCFAuthInfoVM, LoginUserMgtSer, WCFReturnResult, ClientSessionMgt, MsgBoxModel) {
        init();

        var info_Result = {
        };

        function init() {
            info_Result = FunMgtSerClient.GetMenuByAuthInfo_Result();
            $scope.MenuItems = info_Result.Json_MenuItems;
        }

        if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
            $scope.MultiLang = $sessionStorage.MultiLingualRes;
        }

        $scope.Logout = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();

            LoginUserMgtSer.Logout(wcfAuthInfoVM).then(function (resp) {
                if (!angular.isUndefined(resp) && resp != null) {
                    var result = new WCFReturnResult(resp.data);

                    if (!result.HasError()) {
                        var clientSessionMgt = new ClientSessionMgt();
                        clientSessionMgt.ClearUserInfo();
                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, $sessionStorage.MultiLingualRes.Logout || "", $sessionStorage.MultiLingualRes.I003 || "");
                        $state.go('LoginModule.Login');
                    }
                    else {
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), $sessionStorage.MultiLingualRes.ResetPWDTitle, result.GetErrMsgs());
                    }
                }
                msgBox.CloseLoadingDialog();
            });
        };
    };

    MainController.$inject = injectParams_MainController;

    angular.module("MainModule").controller('MainController', MainController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Models/MsgBoxModel.js" />

(function () {
    'use strict';

    var injectParams_Config = ['CustomStateProvider'];

    var config = function (CustomStateProvider) {
        CustomStateProvider.AddState(Path.FunsPath, "SystemInfoManage", "", null);
    }
    config.$inject = injectParams_Config;

    angular.module("MainModule").config(config);

    var injectParams = ['$scope', '$cookies', '$state', '$sessionStorage', '$location', 'WCFAuthInfoVM', 'StaticContentModel', 'SystemInfoRestfulSer', 'ClientSessionMgt', 'SystemInfoVM', 'WCFReturnResult', 'MsgBoxModel'];

    var SystemInfoManageController = function ($scope, $cookies, $state, $sessionStorage, $location, WCFAuthInfoVM, StaticContentModel, SystemInfoRestfulSer, ClientSessionMgt, SystemInfoVM, WCFReturnResult, MsgBoxModel) {
        init();

        function init() {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var pageTitle = "";
            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                $scope.Captions = {
                    SessionTimeoutSeconds: $sessionStorage.MultiLingualRes.SessionTimeoutSeconds,
                    PageSize: $sessionStorage.MultiLingualRes.PageSize,
                    DisplayPageNum: $sessionStorage.MultiLingualRes.DisplayPageNum,
                    DateFormat: $sessionStorage.MultiLingualRes.DateFormat,
                    TimeFormat: $sessionStorage.MultiLingualRes.TimeFormat,
                    Password_Policy: $sessionStorage.MultiLingualRes.Password_Policy,
                    MaximumLoginAttempts: $sessionStorage.MultiLingualRes.MaximumLoginAttempts,
                    Password_Length: $sessionStorage.MultiLingualRes.Password_Length,
                    From: $sessionStorage.MultiLingualRes.From,
                    To: $sessionStorage.MultiLingualRes.To,
                    Password_ReuseNum: $sessionStorage.MultiLingualRes.Password_ReuseNum,
                    Password_ExpireDays: $sessionStorage.MultiLingualRes.Password_ExpireDays,
                    Password_IncludeDiffCase: $sessionStorage.MultiLingualRes.Password_IncludeDiffCase,
                    Password_IncludeNumDigit: $sessionStorage.MultiLingualRes.Password_IncludeNumDigit,
                    Password_IncludeSpecialChar: $sessionStorage.MultiLingualRes.Password_IncludeSpecialChar,
                    Save: $sessionStorage.MultiLingualRes.Save
                };
                pageTitle = $sessionStorage.MultiLingualRes.SystemInfoManage;

                angular.element(window.document)[0].title = $sessionStorage.MultiLingualRes.SystemInfoManage;
            }

            var clientSessionMgt = new ClientSessionMgt();
            clientSessionMgt.PageTitle = pageTitle;
            $scope.SystemInfo = clientSessionMgt.GetSystemInfo();

            //Binding Spinner
            $(".input-group.spinner").spinner('step', function (dir) {
            });

            msgBox.CloseLoadingDialog();
        }

        $scope.Save = function () {
            var msgBox = new MsgBoxModel();
            msgBox.OpenLoadingDialog();
            msgBoxTemp = msgBox;

            var wcfAuthInfoVM = new WCFAuthInfoVM();
            wcfAuthInfoVM.initData();
            wcfAuthInfoVM.SetFunKeyAndTypeKey("SystemInfoManage", "Edit");
            var json_Date = {
                entity_WCFAuthInfoVM: wcfAuthInfoVM,
                entity_SysVM: $scope.SystemInfo
            };
            SystemInfoRestfulSer.Update(json_Date).then(function (resp) {
                var result = new WCFReturnResult(resp.data);
                if (!result.HasError()) {
                    var staticContentModel = new StaticContentModel();
                    SystemInfoRestfulSer.GetSystemInfo(new WCFAuthInfoVM()).then(function (response) {
                        var sysInfo = new SystemInfoVM(response.data);
                        $cookies.putObject(Keys.SystemInfo_CookiesKey, sysInfo);

                        msgBox.ShowMsg(BootstrapDialog.TYPE_SUCCESS, $sessionStorage.MultiLingualRes.SystemInfoManage || "", $sessionStorage.MultiLingualRes.I000 || "");

                    });

                    msgBox.CloseLoadingDialog();
                }
                else {

                    msgBox.CloseLoadingDialog();
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), $sessionStorage.MultiLingualRes.SystemInfoManage, result.GetErrMsgs());
                }
            });
        };
    };

    SystemInfoManageController.$inject = injectParams;

    angular.module("MainModule").controller('SystemInfoManageController', SystemInfoManageController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Models/MsgBoxModel.js" />

(function () {
    'use strict';
    var injectParams_Config = ['CustomStateProvider'];

    var config = function (CustomStateProvider) {

        CustomStateProvider.AddState(Path.SamplePath, "AttendanceModule", "", {
        });
    }
    config.$inject = injectParams_Config;

    angular.module("MainModule").config(config);

    var injectParams = ['$scope', '$q', '$filter', '$stateParams', '$sessionStorage', '$state', 'WCFAuthInfoVM', 'ClientSessionMgt', 'WCFReturnResult', 'WCFErrorContract', 'MsgBoxModel'];

    var AttendanceModuleController = function ($scope, $q, $filter, $stateParams, $sessionStorage, $state, WCFAuthInfoVM, ClientSessionMgt, WCFReturnResult, WCFErrorContract, MsgBoxModel) {
        var pageTitle = "";

        function init() {
            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {

                pageTitle = $sessionStorage.MultiLingualRes.AttendanceModule;

                $scope.AttendanceModule = pageTitle;

                angular.element(window.document)[0].title = pageTitle;
            }
        };

        init();
    };

    AttendanceModuleController.$inject = injectParams;

    angular.module("MainModule").controller('AttendanceModuleController', AttendanceModuleController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Models/MsgBoxModel.js" />

(function () {
    'use strict';
    var injectParams_Config = ['CustomStateProvider'];

    var config = function (CustomStateProvider) {

        CustomStateProvider.AddState(Path.SamplePath, "LeaveModule", "", {
        });
    }
    config.$inject = injectParams_Config;

    angular.module("MainModule").config(config);

    var injectParams = ['$scope', '$q', '$filter', '$stateParams', '$sessionStorage', '$state', 'WCFAuthInfoVM', 'ClientSessionMgt', 'WCFReturnResult', 'WCFErrorContract', 'MsgBoxModel'];

    var LeaveModuleController = function ($scope, $q, $filter, $stateParams, $sessionStorage, $state, WCFAuthInfoVM, ClientSessionMgt, WCFReturnResult, WCFErrorContract, MsgBoxModel) {
        var pageTitle = "";

        function init() {
            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {

                pageTitle = $sessionStorage.MultiLingualRes.LeaveModule;

                $scope.LeaveModule = pageTitle;

                angular.element(window.document)[0].title = pageTitle;
            }
        };

        init();
    };

    LeaveModuleController.$inject = injectParams;

    angular.module("MainModule").controller('LeaveModuleController', LeaveModuleController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Models/MsgBoxModel.js" />

(function () {
    'use strict';
    var injectParams_Config = ['CustomStateProvider'];

    var config = function (CustomStateProvider) {

        CustomStateProvider.AddState(Path.SamplePath, "MaintainSalaryInfo", "", {
        });
    }
    config.$inject = injectParams_Config;

    angular.module("MainModule").config(config);

    var injectParams = ['$scope', '$q', '$filter', '$stateParams', '$sessionStorage', '$state', 'WCFAuthInfoVM', 'ClientSessionMgt', 'WCFReturnResult', 'WCFErrorContract', 'MsgBoxModel'];

    var MaintainSalaryInfoController = function ($scope, $q, $filter, $stateParams, $sessionStorage, $state, WCFAuthInfoVM, ClientSessionMgt, WCFReturnResult, WCFErrorContract, MsgBoxModel) {
        var pageTitle = "";

        function init() {
            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {

                pageTitle = $sessionStorage.MultiLingualRes.MaintainSalaryInfo;

                $scope.MaintainSalaryInfo = pageTitle;

                angular.element(window.document)[0].title = pageTitle;
            }
        };

        init();
    };

    MaintainSalaryInfoController.$inject = injectParams;

    angular.module("MainModule").controller('MaintainSalaryInfoController', MaintainSalaryInfoController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Models/MsgBoxModel.js" />

(function () {
    'use strict';
    var injectParams_Config = ['CustomStateProvider'];

    var config = function (CustomStateProvider) {

        CustomStateProvider.AddState(Path.SamplePath, "SalaryReview", "", {
        });
    }
    config.$inject = injectParams_Config;

    angular.module("MainModule").config(config);

    var injectParams = ['$scope', '$q', '$filter', '$stateParams', '$sessionStorage', '$state', 'WCFAuthInfoVM', 'ClientSessionMgt', 'WCFReturnResult', 'WCFErrorContract', 'MsgBoxModel'];

    var SalaryReviewController = function ($scope, $q, $filter, $stateParams, $sessionStorage, $state, WCFAuthInfoVM, ClientSessionMgt, WCFReturnResult, WCFErrorContract, MsgBoxModel) {
        var pageTitle = "";

        function init() {
            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {

                pageTitle = $sessionStorage.MultiLingualRes.SalaryReview;

                $scope.SalaryReview = pageTitle;

                angular.element(window.document)[0].title = pageTitle;
            }
        };

        init();
    };

    SalaryReviewController.$inject = injectParams;

    angular.module("MainModule").controller('SalaryReviewController', SalaryReviewController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Models/MsgBoxModel.js" />

(function () {
    'use strict';
    var injectParams_Config = ['CustomStateProvider'];

    var config = function (CustomStateProvider) {

        CustomStateProvider.AddState(Path.SamplePath, "StaffInfoManage", "", {
        });
    }
    config.$inject = injectParams_Config;

    angular.module("MainModule").config(config);

    var injectParams = ['$scope', '$q', '$filter', '$stateParams', '$sessionStorage', '$state', 'WCFAuthInfoVM', 'ClientSessionMgt', 'WCFReturnResult', 'WCFErrorContract', 'MsgBoxModel'];

    var StaffInfoManageController = function ($scope, $q, $filter, $stateParams, $sessionStorage, $state, WCFAuthInfoVM, ClientSessionMgt, WCFReturnResult, WCFErrorContract, MsgBoxModel) {
        var pageTitle = "";

        function init() {
            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {

                pageTitle = $sessionStorage.MultiLingualRes.StaffInfoManage;

                $scope.StaffInfoManage = pageTitle;

                angular.element(window.document)[0].title = pageTitle;
            }
        };

        init();
    };

    StaffInfoManageController.$inject = injectParams;

    angular.module("MainModule").controller('StaffInfoManageController', StaffInfoManageController);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../WCFClient/FunMgtSerClient.js" />

(function () {
    'use strict';

    var injectParams = ['$sessionStorage', '$filter', '$location', 'FunMgtSerClient', 'WCFAuthInfoVM', 'WCFReturnResult', 'WCFErrorContract', '$compile', '$templateCache'];

    var funlistdirective = function ($sessionStorage, $filter, $location, FunMgtSerClient, WCFAuthInfoVM, WCFReturnResult, WCFErrorContract, $compile, $templateCache) {
        var directive = {
            link: link,
            restrict: 'E',
            replace: true,
            scope: {
                spefundetaillist: '=',
                funslist: '=',
                displaypagenum: '=',
                pagesize: '=',
                msgboxtitle: '='
            },
            templateUrl: 'SpecificFunList.html'
        };
        return directive;

        function link(scope, element, attrs, ctrl) {
            var orderBy = $filter('orderBy');
            var filter = $filter('filter');
            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                scope.funlist = {};
                scope.funlist.Captions = {};
                scope.funlist.Captions.First = $sessionStorage.MultiLingualRes.First;
                scope.funlist.Captions.Prev = $sessionStorage.MultiLingualRes.Prev;
                scope.funlist.Captions.Next = $sessionStorage.MultiLingualRes.Next;
                scope.funlist.Captions.Last = $sessionStorage.MultiLingualRes.Last;

                scope.funlist.Captions.SpecificFunctions = $sessionStorage.MultiLingualRes.SpecificFunctions;

                scope.funlist.Captions.FunctionKey = $sessionStorage.MultiLingualRes.FunctionKey;
                scope.funlist.Captions.FunctionName = $sessionStorage.MultiLingualRes.FunctionName;
                scope.funlist.Captions.Operation = $sessionStorage.MultiLingualRes.Operation;
                scope.funlist.Captions.Edit = $sessionStorage.MultiLingualRes.Edit;
                scope.funlist.Captions.Delete = $sessionStorage.MultiLingualRes.Delete;
                scope.funlist.Captions.FunctionType = $sessionStorage.MultiLingualRes.FunctionType;
                scope.funlist.Captions.Add = $sessionStorage.MultiLingualRes.Add;
                scope.funlist.Captions.Save = $sessionStorage.MultiLingualRes.Save;

                scope.funlist.Captions.E019 = $sessionStorage.MultiLingualRes.E019;

                scope.funlist.Captions.SearchCriteria = $sessionStorage.MultiLingualRes.SearchCriteria;
            }

            scope.TotalCount = !angular.isUndefined(scope.spefundetaillist) && scope.spefundetaillist != null ? scope.spefundetaillist.length : 0;

            scope.CurrPageIndex = scope.CurrPageIndex ? scope.CurrPageIndex : 1;
            scope.Sort = scope.Sort ? scope.Sort : "FKey";
            scope.SortDir = scope.SortDir ? scope.SortDir : "asc";

            scope.reverse = scope.SortDir == "desc" ? true : false;

            scope.isEditMode = !angular.isUndefined(scope.isEditMode) && scope.isEditMode != null ? scope.isEditMode : false;

            scope.Search = function () {
                scope.FunSelList = orderBy(scope.spefundetaillist, scope.Sort, scope.reverse);

                scope.FunSelList = filter(scope.FunSelList, { FKey: scope.FilterFunctionKey });
                scope.FunSelList = filter(scope.FunSelList, { FName: scope.FilterFunctionName });

                scope.TotalCount = scope.FunSelList.length;
                scope.FunSelList = scope.FunSelList.slice(scope.pagesize * (scope.CurrPageIndex - 1), scope.pagesize * scope.CurrPageIndex);
            };

            scope.SortBy = function (sortCol) {
                scope.reverse = true;
                if (scope.Sort == sortCol) {
                    scope.SortDir = scope.SortDir == "desc" ? "asc" : "desc";
                    scope.reverse = scope.SortDir == "desc" ? true : false;
                }
                else {
                    scope.Sort = sortCol;
                    scope.SortDir = "asc";
                    scope.reverse = false;
                }

                scope.FunSelList = orderBy(scope.spefundetaillist, scope.Sort, scope.reverse);

                scope.FunSelList = filter(scope.FunSelList, { FKey: scope.FilterFunctionKey });

                scope.TotalCount = scope.FunSelList.length;
                scope.FunSelList = scope.FunSelList.slice(scope.pagesize * (scope.CurrPageIndex - 1), scope.pagesize * scope.CurrPageIndex);
            };

            scope.SelectFunDetail = function (FID) {
                scope.isEditMode = true;
                angular.forEach(scope.spefundetaillist, function (fn, index) {
                    if (fn.FID == FID) {
                        scope.SelFunDetailInfo = fn;
                        scope.SelectedFun = FID;
                        scope.EditIndex = index;
                    }
                });

                var temp = true;
                angular.forEach(scope.SelFunDetailInfo.FDSelected, function (fn, index) {
                    if (!fn) {
                        temp = false;
                        return;
                    }
                });
                scope.isCheckAll = temp;
            };

            scope.DelFunDetail = function (FID) {
                angular.forEach(scope.spefundetaillist, function (fn, index) {
                    if (fn.FID == FID) {
                        scope.spefundetaillist.splice(index, 1);
                    }
                });
                scope.PageIndexChange(1);
            };

            scope.AddFunDetail = function () {
                var allowAdd = true;
                angular.forEach(scope.spefundetaillist, function (fn, index) {
                    if (fn.FID == scope.SelectedFun) {
                        allowAdd = false;
                    }
                });
                if (allowAdd) {
                    var notSelected = false;
                    angular.forEach(scope.SelFunDetailInfo.FDSelected, function (fn, index) {
                        if (fn) {
                            notSelected = true;
                            return;
                        }
                    });

                    if (notSelected) {
                        scope.spefundetaillist.push(scope.SelFunDetailInfo);
                        scope.PageIndexChange(1);
                        //Clear Selected Item
                        scope.SelFunDetailInfo = {};
                        scope.SelectedFun = "";
                        scope.isCheckAll = false;
                    }
                    else {
                        var msg = $sessionStorage.MultiLingualRes.E026;
                        //Clear Selected Item
                        scope.SelFunDetailInfo = {};
                        scope.SelectedFun = "";
                        scope.isCheckAll = false;
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), scope.msgboxtitle, msg);
                    }
                }
                else {
                    var msg = $sessionStorage.MultiLingualRes.E002.replace("{0}", scope.SelFunDetailInfo.FName);
                    //Clear Selected Item
                    scope.SelFunDetailInfo = {};
                    scope.SelectedFun = "";
                    scope.isCheckAll = false;
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), scope.msgboxtitle, msg);
                }

            };

            scope.EditFunDetail = function () {
                var allowAdd = true;
                angular.forEach(scope.spefundetaillist, function (fn, index) {
                    if (fn.FID == scope.SelectedFun && scope.EditIndex != index) {
                        allowAdd = false;
                    }
                });
                if (allowAdd) {
                    var notSelected = false;
                    angular.forEach(scope.SelFunDetailInfo.FDSelected, function (fn, index) {
                        if (fn) {
                            notSelected = true;
                            return;
                        }
                    });

                    if (notSelected) {
                        scope.spefundetaillist[scope.EditIndex] = scope.SelFunDetailInfo;
                        scope.PageIndexChange(1);
                        //Clear Selected Item
                        scope.SelFunDetailInfo = {};
                        scope.SelectedFun = "";
                        scope.isCheckAll = false;
                        scope.isEditMode = false;
                    }
                    else {
                        var msg = $sessionStorage.MultiLingualRes.E026;
                        //Clear Selected Item
                        scope.SelFunDetailInfo = {};
                        scope.SelectedFun = "";
                        scope.isCheckAll = false;
                        throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), scope.msgboxtitle, msg);
                    }
                }
                else {
                    var msg = $sessionStorage.MultiLingualRes.E002.replace("{0}", scope.SelFunDetailInfo.FName);
                    //Clear Selected Item
                    scope.SelFunDetailInfo = {};
                    scope.SelectedFun = "";
                    scope.isCheckAll = false;
                    scope.isEditMode = false;
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), scope.msgboxtitle, msg);
                }
            };

            scope.SelectFun = function (funId) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();
                var model = {
                    entity_WCFAuthInfoVM: wcfAuthInfoVM,
                    str_FunID: funId
                };

                FunMgtSerClient.GetFunDetailInfo_FID(model).then(function (resp) {
                    var wcfReturnResult = new WCFReturnResult(resp.data);
                    scope.SelFunDetailInfo = wcfReturnResult;
                }, function (resp) {
                });

                scope.isCheckAll = false;
            };

            scope.CheckAllFunType = function () {
                angular.forEach(scope.SelFunDetailInfo.FDSelected, function (fn, index) {
                    scope.SelFunDetailInfo.FDSelected[index] = scope.isCheckAll;
                });
            };

            scope.CheckFunType = function () {
                var temp = true;
                angular.forEach(scope.SelFunDetailInfo.FDSelected, function (fn, index) {
                    if (!fn) {
                        temp = false;
                        return;
                    }
                });
                scope.isCheckAll = temp;
            };

            scope.PageIndexChange = function (pageIndex) {
                if (scope.spefundetaillist.length > 0) {
                    scope.FunSelList = orderBy(scope.spefundetaillist, scope.Sort, scope.reverse);

                    scope.FunSelList = filter(scope.FunSelList, { FKey: scope.FilterFunctionKey });
                    scope.FunSelList = filter(scope.FunSelList, { FName: scope.FilterFunctionName });

                    scope.CurrPageIndex = pageIndex;
                    scope.TotalCount = scope.FunSelList.length;
                    scope.FunSelList = scope.FunSelList.slice(scope.pagesize * (scope.CurrPageIndex - 1), scope.pagesize * scope.CurrPageIndex);
                }
                else {
                    scope.FunSelList = [];
                    scope.CurrPageIndex = pageIndex;
                    scope.TotalCount = scope.FunSelList.length;
                }
            };

            if (scope.spefundetaillist.length > 0) {
                scope.PageIndexChange(1);
            }
        }
    };

    funlistdirective.$inject = injectParams;

    angular.module('MainModule').directive('funlistdirective', funlistdirective);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../WCFClient/FunMgtSerClient.js" />

(function () {
    'use strict';

    var injectParams = ['FunMgtSerClient', 'WCFAuthInfoVM', 'WCFReturnResult', 'WCFErrorContract', '$compile', '$templateCache'];

    var menubar = function (FunMgtSerClient, WCFAuthInfoVM, WCFReturnResult, WCFErrorContract, $compile, $templateCache) {
        var directive = {
            link: link,
            restrict: 'E',
            scope: {
                menuitems: '=',
                issubmenu: '='
            },
        };
        return directive;

        function link(scope, element, attrs, ctrl) {
            scope.isLel1Menu = !scope.issubmenu;
            scope.HasSubItem = angular.isArray(scope.menuitems);

            element.replaceWith(
                $compile(
                    $templateCache.get('MenuRecursive.html')
                )(scope)
            );
        }
    };

    menubar.$inject = injectParams;

    angular.module('MainModule').directive('menubar', menubar);
})();;/// <reference path="../Scripts/angular.js" />

(function () {
    'use strict';

    var injectParams = ['$state', '$sessionStorage', 'WCFAuthInfoVM', 'WCFReturnResult', 'WCFErrorContract'];

    var navbar = function ($state, $sessionStorage, WCFAuthInfoVM, WCFReturnResult, WCFErrorContract) {
        var directive = {
            link: link,
            restrict: 'E',
            replace: true,
            templateUrl: 'NavBar.html'
        };
        return directive;

        function link(scope, element, attrs, ctrl) {
            var currentState = $state.$current;
            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                if (!angular.isUndefined(currentState) && currentState != null) {
                    var pathLen = currentState.path.length;

                    scope.LinkList = [];
                    angular.forEach(currentState.path, function (value, key) {
                        if (value.self.name == "Main") {
                            scope.LinkList.push({
                                Text: $sessionStorage.MultiLingualRes.Home,
                                Link: "Home.IndexPart1"
                            });
                        }
                        else {
                            var selfPathArray = value.self.name.split(".");
                            selfPathArray = selfPathArray.splice(1, selfPathArray.length - 1);

                            var resource = selfPathArray.join("_");
                            if (resource != "Home") {
                                scope.LinkList.push({
                                    Text: $sessionStorage.MultiLingualRes[resource],
                                    Link: selfPathArray.join(".")
                                });
                            }
                        }
                    });
                }
            }

            scope.pagetitle = angular.element(window.document)[0].title;
        }
    };

    navbar.$inject = injectParams;

    angular.module('MainModule').directive('navbar', navbar);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../WCFClient/FunMgtSerClient.js" />

(function () {
    'use strict';

    var injectParams = ['$sessionStorage', '$filter', '$location', 'FunMgtSerClient', 'WCFAuthInfoVM', 'WCFReturnResult', 'WCFErrorContract', '$compile', '$templateCache'];

    var orglistdirective = function ($sessionStorage, $filter, $location, FunMgtSerClient, WCFAuthInfoVM, WCFReturnResult, WCFErrorContract, $compile, $templateCache) {
        var directive = {
            link: link,
            restrict: 'E',
            replace: true,
            scope: {
                orgsettinglist: '=',
                orgslist: '=',
                orgdetaillist: '=',
                funslist: '=',
                displaypagenum: '=',
                pagesize: '=',
                msgboxtitle: '='
            },
            templateUrl: 'OrgList.html'
        };
        return directive;

        function link(scope, element, attrs, ctrl) {
            var orderBy = $filter('orderBy');
            var filter = $filter('filter');
            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                scope.orglist = {};
                scope.orglist.Captions = {};
                scope.orglist.Captions.First = $sessionStorage.MultiLingualRes.First;
                scope.orglist.Captions.Prev = $sessionStorage.MultiLingualRes.Prev;
                scope.orglist.Captions.Next = $sessionStorage.MultiLingualRes.Next;
                scope.orglist.Captions.Last = $sessionStorage.MultiLingualRes.Last;

                scope.orglist.Captions.OrgSettings = $sessionStorage.MultiLingualRes.OrgSettings;

                scope.orglist.Captions.OrganizationKey = $sessionStorage.MultiLingualRes.OrganizationKey;
                scope.orglist.Captions.OrgDetailsKey = $sessionStorage.MultiLingualRes.OrgDetailsKey;
                scope.orglist.Captions.Operation = $sessionStorage.MultiLingualRes.Operation;
                scope.orglist.Captions.Edit = $sessionStorage.MultiLingualRes.Edit;
                scope.orglist.Captions.Delete = $sessionStorage.MultiLingualRes.Delete;
                scope.orglist.Captions.Add = $sessionStorage.MultiLingualRes.Add;
                scope.orglist.Captions.Save = $sessionStorage.MultiLingualRes.Save;

                scope.orglist.Captions.E019 = $sessionStorage.MultiLingualRes.E019;

                scope.orglist.Captions.SearchCriteria = $sessionStorage.MultiLingualRes.SearchCriteria;
            }

            scope.TotalCount = !angular.isUndefined(scope.orgdetaillist) && scope.orgdetaillist != null ? scope.orgdetaillist.length : 0;

            scope.CurrPageIndex = scope.CurrPageIndex ? scope.CurrPageIndex : 1;
            scope.Sort = scope.Sort ? scope.Sort : "OrganizationKey";
            scope.SortDir = scope.SortDir ? scope.SortDir : "asc";

            scope.reverse = scope.SortDir == "desc" ? true : false;

            scope.isEditMode = !angular.isUndefined(scope.isEditMode) && scope.isEditMode != null ? scope.isEditMode : false;

            scope.Search = function () {
                scope.OrgSelList = orderBy(scope.orgsettinglist, scope.Sort, scope.reverse);

                scope.OrgSelList = filter(scope.OrgSelList, { Org_Key: scope.FilterOrganizationKey });
                scope.OrgSelList = filter(scope.OrgSelList, { OrgDetail_Key: scope.FilterOrgDetailsKey });

                scope.TotalCount = scope.OrgSelList.length;
                scope.OrgSelList = scope.OrgSelList.slice(scope.pagesize * (scope.CurrPageIndex - 1), scope.pagesize * scope.CurrPageIndex);
            };

            scope.SortBy = function (sortCol) {
                scope.reverse = true;
                if (scope.Sort == sortCol) {
                    scope.SortDir = scope.SortDir == "desc" ? "asc" : "desc";
                    scope.reverse = scope.SortDir == "desc" ? true : false;
                }
                else {
                    scope.Sort = sortCol;
                    scope.SortDir = "asc";
                    scope.reverse = false;
                }

                scope.OrgSelList = orderBy(scope.orgsettinglist, scope.Sort, scope.reverse);

                scope.OrgSelList = filter(scope.OrgSelList, { Org_Key: scope.FilterOrganizationKey });
                scope.OrgSelList = filter(scope.OrgSelList, { OrgDetail_Key: scope.FilterOrgDetailsKey });

                scope.TotalCount = scope.OrgSelList.length;
                scope.OrgSelList = scope.OrgSelList.slice(scope.pagesize * (scope.CurrPageIndex - 1), scope.pagesize * scope.CurrPageIndex);
            };

            scope.SelectOrgDetail = function (item) {
                scope.isEditMode = true;
                angular.forEach(scope.orgsettinglist, function (fn, index) {
                    if (fn.Org_ID == item.Org_ID && fn.OrgDetail_ID == item.OrgDetail_ID) {
                        scope.SelSettingInfo = fn;
                        scope.SelectedOrg = item.Org_ID;
                        scope.SelectedOrgDetailKey = item.OrgDetail_ID;
                        scope.EditIndex = index;
                    }
                });
            };

            scope.DelOrgDetail = function (item) {
                angular.forEach(scope.orgsettinglist, function (fn, index) {
                    if (fn.Org_ID == item.Org_ID && fn.OrgDetail_ID == item.OrgDetail_ID) {
                        scope.orgsettinglist.splice(index, 1);
                    }
                });
                scope.PageIndexChange(1);
            };

            scope.AddOrgDetail = function () {
                var allowAdd = true;
                angular.forEach(scope.orgsettinglist, function (fn, index) {
                    if (fn.Org_ID == scope.SelectedOrg && fn.OrgDetail_ID == scope.SelectedOrgDetailKey) {
                        allowAdd = false;
                    }
                });

                var orgInst = {};
                angular.forEach(scope.orgslist, function (fn, index) {
                    if (scope.SelectedOrg == fn.ID) {
                        orgInst = fn;
                        return;
                    }
                });

                var orgDetailInst = {};
                angular.forEach(scope.orgdetaillist, function (fn, index) {
                    if (scope.SelectedOrgDetailKey == fn.ID) {
                        orgDetailInst = fn;
                        return;
                    }
                });

                scope.SelSettingInfo = {
                    Org_ID: orgInst.ID,
                    Org_Path: orgInst.OrganizationPath,
                    Org_Key: orgInst.OrganizationKey,
                    Org_Name: orgInst.OrganizationName,
                    Org_AllowEdit: orgInst.AllowEdit,
                    Org_AllowDel: orgInst.AllowDel,
                    OrgDetail_ID: orgDetailInst.ID,
                    OrgDetail_Key: orgDetailInst.OrgDetailsKey,
                    OrgDetail_Type: orgDetailInst.OrgDetailsType,
                    OrgDetail_TypeName: orgDetailInst.OrgDetailsTypeName,
                    OrgDetail_AllowEdit: orgDetailInst.AllowEdit,
                    OrgDetail_AllowDel: orgDetailInst.AllowDel,
                };

                if (allowAdd) {
                    scope.orgsettinglist.push(scope.SelSettingInfo);
                    scope.PageIndexChange(1);
                    //Clear Selected Item
                    scope.SelSettingInfo = {};
                    scope.SelectedOrg = "";
                    scope.SelectedOrgDetailKey = "";
                }
                else {
                    var msg = $sessionStorage.MultiLingualRes.E002.replace("{0}", scope.SelSettingInfo.Org_Name + " and " + scope.SelSettingInfo.OrgDetail_Key);
                    //Clear Selected Item
                    scope.SelSettingInfo = {};
                    scope.SelectedOrg = "";
                    scope.SelectedOrgDetailKey = "";
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), scope.msgboxtitle, msg);
                }

            };

            scope.EditOrgDetail = function () {
                var allowAdd = true;
                angular.forEach(scope.orgsettinglist, function (fn, index) {
                    if (fn.Org_ID == scope.SelectedOrg && fn.OrgDetail_ID == scope.SelectedOrgDetailKey && scope.EditIndex != index) {
                        allowAdd = false;
                    }
                });

                var orgInst = {};
                angular.forEach(scope.orgslist, function (fn, index) {
                    if (scope.SelectedOrg == fn.ID) {
                        orgInst = fn;
                        return;
                    }
                });

                var orgDetailInst = {};
                angular.forEach(scope.orgdetaillist, function (fn, index) {
                    if (scope.SelectedOrgDetailKey == fn.ID) {
                        orgDetailInst = fn;
                        return;
                    }
                });

                scope.SelSettingInfo = {
                    Org_ID: orgInst.ID,
                    Org_Path: orgInst.OrganizationPath,
                    Org_Key: orgInst.OrganizationKey,
                    Org_Name: orgInst.OrganizationName,
                    Org_AllowEdit: orgInst.AllowEdit,
                    Org_AllowDel: orgInst.AllowDel,
                    OrgDetail_ID: orgDetailInst.ID,
                    OrgDetail_Key: orgDetailInst.OrgDetailsKey,
                    OrgDetail_Type: orgDetailInst.OrgDetailsType,
                    OrgDetail_TypeName: orgDetailInst.OrgDetailsTypeName,
                    OrgDetail_AllowEdit: orgDetailInst.AllowEdit,
                    OrgDetail_AllowDel: orgDetailInst.AllowDel,
                };

                if (allowAdd) {
                    scope.orgsettinglist[scope.EditIndex] = scope.SelSettingInfo;
                    scope.PageIndexChange(1);
                    //Clear Selected Item
                    scope.SelSettingInfo = {};
                    scope.SelectedOrg = "";
                    scope.SelectedOrgDetailKey = "";
                    scope.isEditMode = false;
                }
                else {
                    var msg = $sessionStorage.MultiLingualRes.E002.replace("{0}", scope.SelSettingInfo.Org_Name + " and " + scope.SelSettingInfo.OrgDetail_Key);
                    //Clear Selected Item
                    scope.SelSettingInfo = {};
                    scope.SelectedOrg = "";
                    scope.SelectedOrgDetailKey = "";
                    scope.isEditMode = false;
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), scope.msgboxtitle, msg);
                }
            };

            scope.PageIndexChange = function (pageIndex) {
                if (scope.orgsettinglist.length > 0) {
                    scope.OrgSelList = orderBy(scope.orgsettinglist, scope.Sort, scope.reverse);

                    scope.OrgSelList = filter(scope.OrgSelList, { Org_Key: scope.FilterOrganizationKey });
                    scope.OrgSelList = filter(scope.OrgSelList, { OrgDetail_Key: scope.FilterOrgDetailsKey });

                    scope.CurrPageIndex = pageIndex;
                    scope.TotalCount = scope.OrgSelList.length;
                    scope.OrgSelList = scope.OrgSelList.slice(scope.pagesize * (scope.CurrPageIndex - 1), scope.pagesize * scope.CurrPageIndex);
                }
                else {
                    scope.OrgSelList = [];
                    scope.CurrPageIndex = pageIndex;
                    scope.TotalCount = scope.OrgSelList.length;
                }
            };

            if (scope.orgdetaillist.length > 0) {
                scope.PageIndexChange(1);
            }
        }
    };

    orglistdirective.$inject = injectParams;

    angular.module('MainModule').directive('orglistdirective', orglistdirective);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../WCFClient/FunMgtSerClient.js" />

(function () {
    'use strict';

    var injectParams = ['$compile', '$templateCache', '$sessionStorage'];

    var pagingbar = function ($compile, $templateCache, $sessionStorage) {
        var directive = {
            link: link,
            restrict: 'E',
            replace: true,
            //require: ['^FunListDirective'],
            scope: {
                currpageindex: '=',
                totalcount: '=',
                displaypagenum: '=',
                pagesize: '=',
            },
            templateUrl: 'PagingBar.html'
        };
        return directive;

        function GetPageList(int_TotalRecord, int_PageSize, int_CurrentPage, int_DisplayPageCount) {
            var PageNums = [];

            var TotalPage = 0;

            if (int_TotalRecord > 0) {
                TotalPage = int_TotalRecord % int_PageSize > 0 ? parseInt(int_TotalRecord / int_PageSize) + 1 : parseInt(int_TotalRecord / int_PageSize);

                if (int_DisplayPageCount > TotalPage) {
                    int_DisplayPageCount = TotalPage;
                }

                var temp1 = parseInt((int_DisplayPageCount - 1) / 2);
                var temp2 = (int_DisplayPageCount - 1) - temp1;

                var leftCount = 0;
                var rightCount = 0;

                for (var i = 0; i < temp1; ++i) {
                    if (int_CurrentPage - temp1 + i < 1) {
                        rightCount++;
                    }
                    else {
                        leftCount++;
                    }
                }

                for (var i = 0; i < temp2; ++i) {
                    if (int_CurrentPage + temp2 - i > TotalPage) {
                        leftCount++;
                    }
                    else {
                        rightCount++;
                    }
                }

                for (var i = leftCount; i > 0; --i) {
                    PageNums.push(int_CurrentPage - i);
                }

                PageNums.push(int_CurrentPage);

                for (var i = 1; i <= rightCount; ++i) {
                    PageNums.push(int_CurrentPage + i);
                }


                //Previous
                if (int_CurrentPage - 1 != 0) {
                    PageNums.splice(0, 0, int_CurrentPage - 1);
                    //ret.Insert(0, int_CurrentPage - 1);
                }
                else {
                    PageNums.splice(0, 0, int_CurrentPage);
                    //ret.Insert(0, int_CurrentPage);
                }

                //Next
                if (int_CurrentPage + 1 > TotalPage) {
                    PageNums.push(int_CurrentPage);
                    //ret.Add(int_CurrentPage);
                }
                else {
                    PageNums.push(int_CurrentPage + 1);
                    //ret.Add(int_CurrentPage + 1);
                }
            }
            return {
                Pages: PageNums,
                TotalPage: TotalPage
            }
        }

        function link(scope, element, attrs, ctrl) {
            scope.$watchGroup(['totalcount', 'currpageindex'],
            function () {
                if (!angular.isUndefined(scope.totalcount) && scope.totalcount != null) {
                    //logic based on myAsyncData
                    var pageInfo = GetPageList(scope.totalcount, scope.pagesize, scope.currpageindex, scope.displaypagenum);

                    scope.pagingBar = {};

                    scope.pagingBar.Caption =
                        {
                            First: "First",
                            Prev: "Prev",
                            Next: "Next",
                            Last: "Last"
                        };

                    if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                        scope.pagingBar.Caption.First = $sessionStorage.MultiLingualRes.First;
                        scope.pagingBar.Caption.Prev = $sessionStorage.MultiLingualRes.Prev;
                        scope.pagingBar.Caption.Next = $sessionStorage.MultiLingualRes.Next;
                        scope.pagingBar.Caption.Last = $sessionStorage.MultiLingualRes.Last;
                    }

                    scope.pagingBar.Items = [];

                    if (scope.totalcount > 0) {
                        //First Page
                        var item = {
                            PageIndex: 1,
                            Name: scope.pagingBar.Caption.First,
                            IsFirst: true,
                            Disabled: scope.currpageindex == 1
                        };
                        scope.pagingBar.Items.push(item);

                        //Previous Page And Next Page And Normal Page
                        for (var i = 0; i < pageInfo.Pages.length; ++i) {
                            if (i == 0) {
                                var item = {
                                    PageIndex: pageInfo.Pages[i],
                                    Name: scope.pagingBar.Caption.Prev,
                                    IsPre: true,
                                    Disabled: scope.currpageindex == 1
                                };
                                scope.pagingBar.Items.push(item);
                            }
                            else if (i == pageInfo.Pages.length - 1) {
                                var item = {
                                    PageIndex: pageInfo.Pages[i],
                                    Name: scope.pagingBar.Caption.Next,
                                    IsNext: true,
                                    Disabled: scope.currpageindex == pageInfo.TotalPage
                                };
                                scope.pagingBar.Items.push(item);
                            }
                            else {
                                var item = {
                                    PageIndex: pageInfo.Pages[i],
                                    Name: pageInfo.Pages[i],
                                    IsCurrPage: pageInfo.Pages[i] == scope.currpageindex,
                                    IsPages: true
                                };
                                scope.pagingBar.Items.push(item);
                            }
                        }

                        //Last Page
                        var item = {
                            PageIndex: pageInfo.TotalPage,
                            Name: scope.pagingBar.Caption.Last,
                            IsLast: true,
                            Disabled: scope.currpageindex == pageInfo.TotalPage
                        };
                        scope.pagingBar.Items.push(item);
                    }

                    //Page Change
                    scope.PageChange = function (CurrPageIndex) {
                        scope.$parent.PageIndexChange(CurrPageIndex);
                    };
                }
            });
        }
    };

    pagingbar.$inject = injectParams;

    angular.module('MainModule').directive('pagingbar', pagingbar);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-route.js" />

(function () {
    'use strict';

    var injectParams = ['$sessionStorage'];

    var requriedValidate = function ($sessionStorage) {
        var directive = {
            require: 'ngModel',
            link: link,
            restrict: 'A',
            scope: {
                Caption: '@fieldcaption'
            }
        };
        return directive;

        function link(scope, element, attrs, ctrl) {

            // add a parser that will process each time the value is 
            // parsed into the model when the user updates it.
            ctrl.$parsers.unshift(function (value) {
                var valid = !(value == "");
                ctrl.$setValidity('requriedValidate', valid);
                //scope.ErrorMsg = scope.ErrMsg();
                // if it's valid, return the value to the model, 
                // otherwise return undefined.
                if (!valid)
                    angular.element(element).parent().append("<span class=\"help-block\" style=\"height: 10px; padding-bottom: 0px; margin-top: 8px; margin-bottom: 3px; border-bottom-width: 0px;\" reqVal>" + scope.ErrMsg() + "</span>");
                else {
                    angular.element(element).parent().children("span[reqVal]").remove();
                }
                return valid ? value : undefined;
            });

            // add a formatter that will process each time the value 
            // is updated on the DOM element.
            ctrl.$formatters.unshift(function (value) {
                // validate.
                var valid = !(value == "") || ctrl.$pristine;
                ctrl.$setValidity('requriedValidate', valid);

                // return the value or nothing will be written to the DOM.
                if (!valid)
                    angular.element(element).parent().append("<span class=\"help-block\" style=\"height: 10px; padding-bottom: 0px; margin-top: 8px; margin-bottom: 3px; border-bottom-width: 0px;\" reqVal>" + scope.ErrMsg() + "</span>");
                else {
                    angular.element(element).parent().children("span[reqVal]").remove();
                }
                return value;
            });

            scope.ErrMsg = function () {
                var E001Msg = scope.Caption;
                if (!angular.isUndefined($sessionStorage.MultiLingualRes) && !angular.isUndefined($sessionStorage.MultiLingualRes.E001)) {
                    E001Msg = $sessionStorage.MultiLingualRes.E001;
                    E001Msg = E001Msg.replace(/\{0\}/g, scope.Caption);
                }
                return E001Msg;
            }

        }
    };

    requriedValidate.$inject = injectParams;

    angular.module('ValidationModule').directive('requriedValidate', requriedValidate);
})();/// <reference path="../Scripts/angular.js" />
/// <reference path="../WCFClient/FunMgtSerClient.js" />

(function () {
    'use strict';

    var injectParams = ['$sessionStorage', '$filter', '$location', 'RoleMgtSerClient', 'WCFAuthInfoVM', 'WCFReturnResult', 'WCFErrorContract', '$compile', '$templateCache'];

    var rolelistdirective = function ($sessionStorage, $filter, $location, RoleMgtSerClient, WCFAuthInfoVM, WCFReturnResult, WCFErrorContract, $compile, $templateCache) {
        var directive = {
            link: link,
            restrict: 'E',
            replace: true,
            scope: {
                speroledetaillist: '=',
                roleslist: '=',
                displaypagenum: '=',
                pagesize: '=',
                msgboxtitle: '='
            },
            templateUrl: 'RoleList.html'
        };
        return directive;

        function link(scope, element, attrs, ctrl) {
            var orderBy = $filter('orderBy');
            var filter = $filter('filter');
            if (!angular.isUndefined($sessionStorage.MultiLingualRes) && $sessionStorage.MultiLingualRes != null) {
                scope.rolelist = {};
                scope.rolelist.Captions = {};
                scope.rolelist.Captions.First = $sessionStorage.MultiLingualRes.First;
                scope.rolelist.Captions.Prev = $sessionStorage.MultiLingualRes.Prev;
                scope.rolelist.Captions.Next = $sessionStorage.MultiLingualRes.Next;
                scope.rolelist.Captions.Last = $sessionStorage.MultiLingualRes.Last;

                scope.rolelist.Captions.RoleSettings = $sessionStorage.MultiLingualRes.RoleSettings;

                scope.rolelist.Captions.RoleName = $sessionStorage.MultiLingualRes.RoleName;
                scope.rolelist.Captions.Operation = $sessionStorage.MultiLingualRes.Operation;
                scope.rolelist.Captions.Edit = $sessionStorage.MultiLingualRes.Edit;
                scope.rolelist.Captions.Delete = $sessionStorage.MultiLingualRes.Delete;
                scope.rolelist.Captions.Add = $sessionStorage.MultiLingualRes.Add;
                scope.rolelist.Captions.Save = $sessionStorage.MultiLingualRes.Save;

                scope.rolelist.Captions.E019 = $sessionStorage.MultiLingualRes.E019;

                scope.rolelist.Captions.SearchCriteria = $sessionStorage.MultiLingualRes.SearchCriteria;
            }

            scope.TotalCount = !angular.isUndefined(scope.speroledetaillist) && scope.speroledetaillist != null ? scope.speroledetaillist.length : 0;

            scope.CurrPageIndex = scope.CurrPageIndex ? scope.CurrPageIndex : 1;
            scope.Sort = scope.Sort ? scope.Sort : "RoleName";
            scope.SortDir = scope.SortDir ? scope.SortDir : "asc";

            scope.reverse = scope.SortDir == "desc" ? true : false;

            scope.isEditMode = !angular.isUndefined(scope.isEditMode) && scope.isEditMode != null ? scope.isEditMode : false;

            scope.Search = function () {
                scope.RoleSelList = orderBy(scope.speroledetaillist, scope.Sort, scope.reverse);

                scope.RoleSelList = filter(scope.RoleSelList, { RoleName: scope.FilterRoleName });

                scope.TotalCount = scope.RoleSelList.length;
                scope.RoleSelList = scope.RoleSelList.slice(scope.pagesize * (scope.CurrPageIndex - 1), scope.pagesize * scope.CurrPageIndex);
            };

            scope.SortBy = function (sortCol) {
                scope.reverse = true;
                if (scope.Sort == sortCol) {
                    scope.SortDir = scope.SortDir == "desc" ? "asc" : "desc";
                    scope.reverse = scope.SortDir == "desc" ? true : false;
                }
                else {
                    scope.Sort = sortCol;
                    scope.SortDir = "asc";
                    scope.reverse = false;
                }

                scope.RoleSelList = orderBy(scope.speroledetaillist, scope.Sort, scope.reverse);

                scope.RoleSelList = filter(scope.RoleSelList, { RoleName: scope.FilterRoleName });

                scope.TotalCount = scope.RoleSelList.length;
                scope.RoleSelList = scope.RoleSelList.slice(scope.pagesize * (scope.CurrPageIndex - 1), scope.pagesize * scope.CurrPageIndex);
            };

            scope.SelectRoleDetail = function (RoleID) {
                scope.isEditMode = true;
                angular.forEach(scope.speroledetaillist, function (fn, index) {
                    if (fn.ID == RoleID) {
                        scope.SelRoleDetailInfo = fn;
                        scope.SelectedRole = RoleID;
                        scope.EditIndex = index;
                    }
                });
            };

            scope.DelRoleDetail = function (RoleID) {
                angular.forEach(scope.speroledetaillist, function (fn, index) {
                    if (fn.ID == RoleID) {
                        scope.speroledetaillist.splice(index, 1);
                    }
                });
                scope.PageIndexChange(1);
            };

            scope.AddRoleDetail = function () {
                var allowAdd = true;
                var roleName = "";
                angular.forEach(scope.speroledetaillist, function (fn, index) {
                    if (fn.ID == scope.SelectedRole) {
                        roleName = fn.RoleName
                        allowAdd = false;
                    }
                });
                if (allowAdd) {
                    angular.forEach(scope.roleslist, function (value, key) {
                        if (value.ID == scope.SelectedRole) {
                            scope.SelRoleDetailInfo = value;
                            return;
                        }
                    });

                    scope.speroledetaillist.push(scope.SelRoleDetailInfo);
                    scope.PageIndexChange(1);
                    //Clear Selected Item
                    scope.SelRoleDetailInfo = {};
                    scope.SelectedRole = "";
                }
                else {
                    var msg = $sessionStorage.MultiLingualRes.E002.replace("{0}", roleName);
                    //Clear Selected Item
                    scope.SelRoleDetailInfo = {};
                    scope.SelectedRole = "";
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), scope.msgboxtitle, msg);
                }
            };

            scope.EditRoleDetail = function () {
                var allowAdd = true;
                angular.forEach(scope.speroledetaillist, function (fn, index) {
                    if (fn.ID == scope.SelectedRole && scope.EditIndex != index) {
                        allowAdd = false;
                    }
                });
                if (allowAdd) {
                    angular.forEach(scope.roleslist, function (value, key) {
                        if (value.ID == scope.SelectedRole) {
                            scope.SelRoleDetailInfo = value;
                            return;
                        }
                    });

                    scope.speroledetaillist[scope.EditIndex] = scope.SelRoleDetailInfo;
                    scope.PageIndexChange(1);
                    //Clear Selected Item
                    scope.SelRoleDetailInfo = {};
                    scope.SelectedRole = "";
                    scope.isEditMode = false;
                }
                else {
                    var msg = $sessionStorage.MultiLingualRes.E002.replace("{0}", scope.SelRoleDetailInfo.RoleName);
                    //Clear Selected Item
                    scope.SelRoleDetailInfo = {};
                    scope.SelectedRole = "";
                    scope.isEditMode = false;
                    throw new ExcetionInst(ExceptionType.ValidationError, $location.path(), scope.msgboxtitle, msg);
                }
            };

            scope.SelectRole = function (funId) {
                var wcfAuthInfoVM = new WCFAuthInfoVM();
                wcfAuthInfoVM.initData();
            };

            scope.PageIndexChange = function (pageIndex) {
                if (scope.speroledetaillist.length > 0) {
                    scope.RoleSelList = orderBy(scope.speroledetaillist, scope.Sort, scope.reverse);

                    scope.RoleSelList = filter(scope.RoleSelList, { RoleName: scope.FilterRoleName });

                    scope.CurrPageIndex = pageIndex;
                    scope.TotalCount = scope.RoleSelList.length;
                    scope.RoleSelList = scope.RoleSelList.slice(scope.pagesize * (scope.CurrPageIndex - 1), scope.pagesize * scope.CurrPageIndex);
                }
                else {
                    scope.RoleSelList = [];
                    scope.CurrPageIndex = pageIndex;
                    scope.TotalCount = scope.RoleSelList.length;
                }
            };

            if (scope.speroledetaillist.length > 0) {
                scope.PageIndexChange(1);
            }
        }
    };

    rolelistdirective.$inject = injectParams;

    angular.module('MainModule').directive('rolelistdirective', rolelistdirective);
})();;/// <reference path="../Scripts/angular.js" />
(function () {
    'use strict';

    var injectParams = ['$http'];

    var AuditLogMgtSerClient = function ($http) {
        var result_GetEmptyAuditLogVM = {};

        this.GetListWithPaging = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'AuditLogMgtService.svc/GetListWithPaging',
                data: json_Data
            });

            return request;
        };

        this.GetEmptyAuditLogVM = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'AuditLogMgtService.svc/GetEmptyAuditLogVM',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetEmptyAuditLogVM = resp.data;
            });
        };

        this.GetEmptyAuditLogVM_Result = function () {
            return result_GetEmptyAuditLogVM;
        };
    };

    AuditLogMgtSerClient.$inject = injectParams;

    angular.module('WCFClient').service('AuditLogMgtSerClient', AuditLogMgtSerClient);
})();;/// <reference path="../Scripts/angular.js" />
(function () {
    'use strict';

    var injectParams = ['$http'];

    var AuthHisSerClient = function ($http) {
        var result_GetEmptyAuthHisVM = {};

        this.GetListWithPaging = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'AuthHisService.svc/GetListWithPaging',
                data: json_Data
            });

            return request;
        };

        this.Delete = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'AuthHisService.svc/Delete',
                data: json_Data
            });

            return request;
        };

        this.GetEmptyAuthHisVM = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'AuthHisService.svc/GetEmptyAuthHisVM',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetEmptyAuthHisVM = resp.data;
            });
        };

        this.GetEmptyAuthHisVM_Result = function () {
            return result_GetEmptyAuthHisVM;
        };
    };

    AuthHisSerClient.$inject = injectParams;

    angular.module('WCFClient').service('AuthHisSerClient', AuthHisSerClient);
})();;/// <reference path="../Scripts/angular.js" />
(function () {
    'use strict';

    var injectParams = ['$http'];

    var CheckPrivilegeSerClient = function ($http) {
        this.CheckPrivilege = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'CheckPrivilegeService.svc/CheckPrivilege',
                data: json_Data
            });

            return request;
        };

        this.CheckPrivilegeWithLUserID = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'CheckPrivilegeService.svc/CheckPrivilegeWithLUserID',
                data: json_Data
            });

            return request;
        };
    };

    CheckPrivilegeSerClient.$inject = injectParams;

    angular.module('WCFClient').service('CheckPrivilegeSerClient', CheckPrivilegeSerClient);
})();;/// <reference path="../Scripts/angular.js" />
(function () {
    'use strict';

    var injectParams = ['$http'];

    var FunMgtSerClient = function ($http) {
        var result_GetMenuByAuthInfo = {};

        var result_GetEmptyFVM = {};

        var result_GetEntityByID = {};

        var result_GetAll = {};

        this.GetAllFunWFunType = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunMgtService.svc/GetAllFunWFunType',
                data: json_Data
            });

            return request;
        };

        this.GetMenuByAuthInfo = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunMgtService.svc/GetMenuByAuthInfo',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetMenuByAuthInfo = resp.data;
            });
        };

        this.GetMenuByAuthInfo_Result = function () {
            return result_GetMenuByAuthInfo;
        };


        this.GetListWithPaging = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunMgtService.svc/GetListWithPaging',
                data: json_Data
            });

            return request;
        };

        this.GetEntityByID = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunMgtService.svc/GetEntityByID',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetEntityByID = resp.data;
            });
        };

        this.GetEntityByID_Result = function () {
            return result_GetEntityByID;
        };


        this.Create = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunMgtService.svc/Create',
                data: json_Data
            });

            return request;
        };

        this.Delete = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunMgtService.svc/Delete',
                data: json_Data
            });

            return request;
        };

        this.Update = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunMgtService.svc/Update',
                data: json_Data
            });

            return request;
        };

        this.GetAll = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunMgtService.svc/GetAll',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetAll = resp.data;
            });
        };

        this.GetAll_Result = function () {
            return result_GetAll;
        };

        this.GetParentFunctions = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunMgtService.svc/GetParentFunctions',
                data: json_Data
            });

            return request;
        };

        this.GetFunDetailInfo_FID = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunMgtService.svc/GetFunDetailInfo_FID',
                data: json_Data
            });

            return request;
        };

        this.GetEmptyFVM = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunMgtService.svc/GetEmptyFVM',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetEmptyFVM = resp.data;
            });
        };

        this.GetEmptyFVM_Result = function () {
            return result_GetEmptyFVM;
        };
    };

    FunMgtSerClient.$inject = injectParams;

    angular.module('WCFClient').service('FunMgtSerClient', FunMgtSerClient);

})();;/// <reference path="../Scripts/angular.js" />
(function () {
    'use strict';

    var injectParams = ['$http'];

    var FunTypeMgtSerClient = function ($http) {
        var result_GetEntityByID = {};

        var result_GetEmptyFTVM = {};

        var result_GetAllFunType = {};

        this.GetListWithPaging = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunTypeMgtService.svc/GetListWithPaging',
                data: json_Data
            });

            return request;
        };

        this.GetEntityByID = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunTypeMgtService.svc/GetEntityByID',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetEntityByID = resp.data;
            });
        };

        this.GetEntityByID_Result = function () {
            return result_GetEntityByID;
        };

        this.Create = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunTypeMgtService.svc/Create',
                data: json_Data
            });

            return request;
        };

        this.Delete = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunTypeMgtService.svc/Delete',
                data: json_Data
            });

            return request;
        };

        this.Update = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunTypeMgtService.svc/Update',
                data: json_Data
            });

            return request;
        };

        this.GetAllFunType = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunTypeMgtService.svc/GetAllFunType',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetAllFunType = resp.data;
            });
        };

        this.GetAllFunType_Result = function () {
            return result_GetAllFunType;
        };

        this.GetEmptyFTVM = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'FunTypeMgtService.svc/GetEmptyFTVM',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetEmptyFTVM = resp.data;
            });
        };

        this.GetEmptyFTVM_Result = function () {
            return result_GetEmptyFTVM;
        };
    };

    FunTypeMgtSerClient.$inject = injectParams;

    angular.module('WCFClient').service('FunTypeMgtSerClient', FunTypeMgtSerClient);

})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-route.js" />
(function () {
    'use strict';

    var injectParams = ['$http'];

    var LoginUserMgtSer = function ($http) {
        var result_GetEntityByID = {};
        var result_GetEmptyLoginUserVM = {};
        var result_GetEntityByIDWDetails = {};
        var result_GetAuthInfo = {};

        this.Login = function (LoginUserJson) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'LoginUserMgtService.svc/login',
                data: LoginUserJson
            });

            return request;
        };

        this.ResetPwd = function (LoginUserJson) {
            var request = $http({
                method: "POST",
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'LoginUserMgtService.svc/ResetPwd',
                data: LoginUserJson
            });
            return request;
        };
        this.GetEmptyLoginUserVM = function () {
            var request = $http({
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'LoginUserMgtService.svc/GetEmptyLoginUserVM',
                data: {}
            });

            return request.then(function (resp) { result_GetEmptyLoginUserVM = resp.data; });
        };
        this.GetEmptyLoginUserVM_Result = function () {
            return result_GetEmptyLoginUserVM;
        };

        this.GetEntityByID = function (json_Data) {
            var request = $http({
                method: "POST",
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'LoginUserMgtService.svc/GetEntityByID',
                data: json_Data
            });
            return request.then(function (resp) { result_GetEntityByID = resp.data; });
        };
        this.GetEntityByID_Result = function () {
            return result_GetEntityByID;
        };

        this.Logout = function (json_Data) {
            var request = $http({
                method: "POST",
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'LoginUserMgtService.svc/Logout',
                data: json_Data
            });
            return request;
        };

        this.GetListWithPaging = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'LoginUserMgtService.svc/GetListWithPaging',
                data: json_Data
            });

            return request;
        };

        this.GetEntityByIDWDetails = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'LoginUserMgtService.svc/GetEntityByIDWDetails',
                data: json_Data
            });

            return request.then(function (resp) { result_GetEntityByIDWDetails = resp.data; });
        };
        this.GetEntityByIDWDetails_Result = function () {
            return result_GetEntityByIDWDetails;
        };

        this.Create = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'LoginUserMgtService.svc/Create',
                data: json_Data
            });

            return request;
        };

        this.Delete = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'LoginUserMgtService.svc/Delete',
                data: json_Data
            });

            return request;
        };

        this.Update = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'LoginUserMgtService.svc/Update',
                data: json_Data
            });

            return request;
        };

        this.GetAuthInfo = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'LoginUserMgtService.svc/GetAuthInfo',
                data: json_Data
            });

            return request.then(function (resp) { result_GetAuthInfo = resp.data; });
        };
        this.GetAuthInfo_Result = function () {
            return result_GetAuthInfo;
        };

        this.GetLUIDList = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'LoginUserMgtService.svc/GetLUIDList',
                data: json_Data
            });

            return request;
        };

        this.GetOrgIDList = function (result_SessionWUserInfo, FKey, FTKey, entityList_OrgVM) {
            var entity_FunDetailInfo = {};
            if (!angular.isUndefined(result_SessionWUserInfo) && result_SessionWUserInfo != null) {
                angular.forEach(result_SessionWUserInfo.EntityList_FDInfo, function (value, key) {
                    if (value.FKey == FKey) {
                        entity_FunDetailInfo = value;
                        return;
                    }
                });
            }

            var strList_ID = [];

            var strList_Path = [];

            var entityList_Org = [];

            if (entity_FunDetailInfo != null) {
                if (entity_FunDetailInfo.FTName.indexOf(FTKey) > -1) {
                    if (entity_FunDetailInfo.OrgPath.length > 0) {
                        var fdIndex = entity_FunDetailInfo.FTName.indexOf(FTKey);

                        if (entity_FunDetailInfo.FDSelected[fdIndex]) {
                            strList_Path.push(entity_FunDetailInfo.OrgPath[fdIndex].Value[0]);

                            var orgVM_Array = [];

                            angular.forEach(entityList_OrgVM, function (entity_OrgVM, key) {

                                angular.forEach(strList_Path, function (str_Path, key) {
                                    if (entity_OrgVM.OrganizationPath.indexOf(str_Path) == 0 && entity_OrgVM.OrganizationPath != str_Path) {
                                        orgVM_Array.push(entity_OrgVM);
                                    }
                                });

                            });

                            angular.forEach(orgVM_Array, function (orgVM, key) {

                                strList_ID.push(orgVM.ID);

                            });
                        }
                    }
                    else {
                        angular.forEach(entityList_OrgVM, function (orgVM, key) {

                            strList_ID.push(orgVM.ID);

                        });
                    }
                }
            }

            angular.forEach(entityList_OrgVM, function (value_Obj, key) {
                angular.forEach(strList_ID, function (value_ID, key) {
                    if (value_ID == value_Obj.ID) {
                        entityList_Org.push(value_Obj);
                    }
                });
            });

            return entityList_Org;
        };
    }

    LoginUserMgtSer.$inject = injectParams;

    angular.module('WCFClient').service('LoginUserMgtSer', LoginUserMgtSer);

})();;/// <reference path="../Scripts/angular.js" />
(function () {
    'use strict';

    var injectParams = ['$http'];

    var OrgDetailMgtSerClient = function ($http) {
        var result_GetEmptyOrgDetailVM = {};

        var result_GetEntityByID = {};

        var result_GetPrivilegeByUserID = {};

        var result_GetRoleSettingsByOrgDID = {};

        var result_GetAll = {};

        this.GetListWithPaging = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgDetailMgtService.svc/GetListWithPaging',
                data: json_Data
            });

            return request;
        };

        this.GetEntityByID = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgDetailMgtService.svc/GetEntityByID',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetEntityByID = resp.data;
            });
        };

        this.GetEntityByID_Result = function () {
            return result_GetEntityByID;
        };

        this.Create = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgDetailMgtService.svc/Create',
                data: json_Data
            });

            return request;
        };

        this.Delete = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgDetailMgtService.svc/Delete',
                data: json_Data
            });

            return request;
        };

        this.Update = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgDetailMgtService.svc/Update',
                data: json_Data
            });

            return request;
        };

        this.GetAll = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgDetailMgtService.svc/GetAll',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetAll = resp.data;
            });
        };

        this.GetAll_Result = function () {
            return result_GetAll;
        };

        this.GetRoleSettingsByOrgDID = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgDetailMgtService.svc/GetRoleSettingsByOrgDID',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetRoleSettingsByOrgDID = resp.data;
            });
        };

        this.GetRoleSettingsByOrgDID_Result = function () {
            return result_GetRoleSettingsByOrgDID;
        };

        this.GetPrivilegeByUserID = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgDetailMgtService.svc/GetPrivilegeByUserID',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetPrivilegeByUserID = resp.data;
            }, function (resp) {
                result_GetPrivilegeByUserID = resp.data;
            });
        };

        this.GetPrivilegeByUserID_Result = function () {
            return result_GetPrivilegeByUserID;
        };

        this.GetEmptyOrgDetailVM = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgDetailMgtService.svc/GetEmptyOrgDetailVM',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetEmptyOrgDetailVM = resp.data;
            });
        };

        this.GetEmptyOrgDetailVM_Result = function () {
            return result_GetEmptyOrgDetailVM;
        };
    };

    OrgDetailMgtSerClient.$inject = injectParams;

    angular.module('WCFClient').service('OrgDetailMgtSerClient', OrgDetailMgtSerClient);
})();;/// <reference path="../Scripts/angular.js" />
(function () {
    'use strict';

    var injectParams = ['$http'];

    var OrgMgtSerClient = function ($http) {
        var result_GetEmptyOrgVM = {};

        var result_GetEntityByID = {};

        var result_GetAll = {};

        this.GetAll = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgMgtService.svc/GetAll',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetAll = resp.data;
            });
        };

        this.GetAll_Result = function () {
            return result_GetAll;
        };

        this.GetEntityListByIDList_LUserAccessByOrgVM = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgMgtService.svc/GetEntityListByIDList_LUserAccessByOrgVM',
                data: json_Data
            });

            return request;
        };

        this.GetListWithPaging = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgMgtService.svc/GetListWithPaging',
                data: json_Data
            });

            return request;
        };

        this.GetEntityByID = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgMgtService.svc/GetEntityByID',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetEntityByID = resp.data;
            });
        };

        this.GetEntityByID_Result = function () {
            return result_GetEntityByID;
        };

        this.Create = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgMgtService.svc/Create',
                data: json_Data
            });

            return request;
        };

        this.Delete = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgMgtService.svc/Delete',
                data: json_Data
            });

            return request;
        };

        this.Update = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgMgtService.svc/Update',
                data: json_Data
            });

            return request;
        };

        this.GetEmptyOrgVM = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgMgtService.svc/GetEmptyOrgVM',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetEmptyOrgVM = resp.data;
            });
        };

        this.GetEmptyOrgVM_Result = function () {
            return result_GetEmptyOrgVM;
        };

        this.GetOrgPathListByLUID = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'OrgMgtService.svc/GetOrgPathListByLUID',
                data: json_Data
            });

            return request;
        };
    };

    OrgMgtSerClient.$inject = injectParams;

    angular.module('WCFClient').service('OrgMgtSerClient', OrgMgtSerClient);
})();;/// <reference path="../Scripts/angular.js" />
(function () {
    'use strict';

    var injectParams = ['$http'];

    var RoleMgtSerClient = function ($http) {
        var result_GetEmptyRoleVM = {};

        var result_GetEntityByID = {};

        var result_GetAll = {};

        this.GetAll = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'RoleMgtService.svc/GetAll',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetAll = resp.data;
            });
        };

        this.GetAll_Result = function () {
            return result_GetAll;
        };

        this.GetEntityListByIDList = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'RoleMgtService.svc/GetEntityListByIDList',
                data: json_Data
            });

            return request;
        };

        this.GetListWithPaging = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'RoleMgtService.svc/GetListWithPaging',
                data: json_Data
            });

            return request;
        };

        this.GetEntityByID = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'RoleMgtService.svc/GetEntityByID',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetEntityByID = resp.data;
            });
        };

        this.GetEntityByID_Result = function () {
            return result_GetEntityByID;
        };

        this.Create = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'RoleMgtService.svc/Create',
                data: json_Data
            });

            return request;
        };

        this.Delete = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'RoleMgtService.svc/Delete',
                data: json_Data
            });

            return request;
        };

        this.Update = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'RoleMgtService.svc/Update',
                data: json_Data
            });

            return request;
        };

        this.GetEmptyRoleVM = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'RoleMgtService.svc/GetEmptyRoleVM',
                data: json_Data
            });

            return request.then(function (resp) {
                result_GetEmptyRoleVM = resp.data;
            });
        };

        this.GetEmptyRoleVM_Result = function () {
            return result_GetEmptyRoleVM;
        };
    };

    RoleMgtSerClient.$inject = injectParams;

    angular.module('WCFClient').service('RoleMgtSerClient', RoleMgtSerClient);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-route.js" />
(function () {
    'use strict';

    var injectParams = ['$http'];

    var SystemInfoRestfulSer = function ($http) {

        this.GetMultiLingualResSer = function (str_LangKey) {
            var request = $http({
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'SystemMgtService.svc/GetMultiLingualResSer/' + (str_LangKey != "" ? str_LangKey : "en"),
                data: {}
            });
            return request;
        };

        this.GetSystemInfo = function (wcfAuthInfoVM) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'SystemMgtService.svc/GetSystemInfo',
                data: wcfAuthInfoVM
            });
            return request;
        };

        this.Update = function (json_Data) {
            var request = $http({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                url: WCFPath + 'SystemMgtService.svc/Update',
                data: json_Data
            });
            return request;
        };
    }

    SystemInfoRestfulSer.$inject = injectParams;

    angular.module('WCFClient').service('SystemInfoRestfulSer', SystemInfoRestfulSer);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-route.js" />
(function () {
    'use strict';

    var injectParams = [];

    var LUSerLoginResult = function () {
        function LUSerLoginResult(LUData) {
            if (LUData) {
                this.setData(LUData);
            }
        };
        LUSerLoginResult.prototype = {
            setData: function (LUData) {
                angular.extend(this, LUData);
            },
            HasError: function () {
                var scope = this;

                return !scope.IsSuccess;
            },
            PwdExpire: function () {
                var scope = this;
                return scope.IsPWDExpire;
            },
            GetErrMsgs: function () {
                var msgTxt = "";
                if (!angular.isUndefined(this.StrList_Error) && this.StrList_Error.length > 0) {
                    msgTxt = this.StrList_Error.join("<br/>");
                }
                return msgTxt;
            }
        };
        return LUSerLoginResult;
    }

    LUSerLoginResult.$inject = injectParams;

    angular.module('CoolPrivilegeModel').factory('LUSerLoginResult', LUSerLoginResult);

})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-route.js" />
(function () {
    'use strict';

    var injectParams = [];

    var LoginUserModel = function () {
        function LoginUserModel(LUData) {
            if (LUData) {
                this.setData(LUData);
            }
        };
        LoginUserModel.prototype = {
            setData: function (LUData) {
                angular.extend(this, LUData);
            },
        };
        return LoginUserModel;
    };

    LoginUserModel.$inject = injectParams;

    angular.module('CoolPrivilegeModel').factory('LoginUserModel', LoginUserModel);

})();; (function () {
    'use strict';

    var injectParams = [];

    var MsgBoxModel = function () {
        function MsgBoxModel(LUData) {
            if (LUData) {
                this.setData(LUData);
            }

            this.LoadingDialog = new BootstrapDialog({
                type: BootstrapDialog.TYPE_INFO,
                message: "<div style=\"text-align:center;\"><i class=\"fa fa-refresh fa-spin fa-3x\" style=\"-webkit-animation: spin 1000ms infinite linear;animation: spin 1000ms infinite linear;\"></i></div>",
                closable: false
            });

            this.IsTablet = false;
            this.IsMobi = false;
        };
        MsgBoxModel.prototype = {
            setData: function (LUData) {
                angular.extend(this, LUData);
            },

            OpenLoadingDialog: function () {
                this.LoadingDialog.realize();
                this.LoadingDialog.getModalHeader().hide();
                this.LoadingDialog.getModalFooter().hide();

                this.LoadingDialog.open();
            },

            CloseLoadingDialog: function () {
                this.LoadingDialog.close();
            },

            ShowMsg: function (DialogType, strTitle, strMsg) {
                this.CheckWindowType();
                if (this.IsMobi || this.IsTablet) {
                    BootstrapDialog.show({
                        cssClass: 'smallSize',
                        type: DialogType,
                        title: strTitle,
                        message: strMsg,
                        closable: false,
                        buttons: [{
                            label: 'OK',
                            action: function (dialog) {
                                dialog.close();
                            }
                        }]
                    });
                }
                else {
                    BootstrapDialog.show({
                        type: DialogType,
                        title: strTitle,
                        message: strMsg,
                        closable: false,
                        buttons: [{
                            label: 'OK',
                            action: function (dialog) {
                                dialog.close();
                            }
                        }]
                    });
                }
            },

            GetConfirmMsgBox: function (DialogType, strTitle, strMsg, buttonsJsonArray) {
                this.CheckWindowType();

                var sizeType = BootstrapDialog.SIZE_NORMAL;

                if (this.IsMobi || this.IsTablet) {
                    var dialog = new BootstrapDialog({
                        cssClass: 'smallSize',
                        type: DialogType,
                        title: strTitle,
                        message: strMsg,
                        closable: false,
                        buttons: buttonsJsonArray || [{
                            id: 'OKbtn',
                            label: 'OK',
                        }]
                    });
                }
                else {
                    var dialog = new BootstrapDialog({
                        type: DialogType,
                        title: strTitle,
                        message: strMsg,
                        closable: false,
                        buttons: buttonsJsonArray || [{
                            id: 'OKbtn',
                            label: 'OK',
                        }]
                    });
                }

                return dialog;
            }

            , CheckWindowType: function () {
                if (window.navigator.userAgent.match(/Mobile/i)
                || window.navigator.userAgent.match(/iPhone/i)
                || window.navigator.userAgent.match(/iPod/i)
                || window.navigator.userAgent.match(/IEMobile/i)
                || window.navigator.userAgent.match(/Windows Phone/i)
                || window.navigator.userAgent.match(/Android/i)
                || window.navigator.userAgent.match(/BlackBerry/i)
                || window.navigator.userAgent.match(/webOS/i)) {
                    this.IsMobi = true;
                } else {
                }
                if (window.navigator.userAgent.match(/Tablet/i)
                || window.navigator.userAgent.match(/iPad/i)
                || window.navigator.userAgent.match(/Nexus 7/i)
                || window.navigator.userAgent.match(/Nexus 10/i)
                || window.navigator.userAgent.match(/KFAPWI/i)) {
                    this.IsMobi = false;
                    this.IsTablet = true;
                } else {

                }
            }
        };
        return MsgBoxModel;
    };

    MsgBoxModel.$inject = injectParams;

    angular.module('CoolPrivilegeModel').factory('MsgBoxModel', MsgBoxModel);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-route.js" />
var defaultLangKey = "en";

var Keys =
{
    SessionInfo_CookiesKey: "SessionInfo",
    SystemInfo_CookiesKey: "SystemInfo",
};

var Path = {
    AccControlLoginPath: "../../Views/Components/Login/",
    ErrorPath: "../../Views/Components/Error/",
    HomePath: "../../Views/Components/Home/",
    FunsPath: "../../Views/Components/Funs/",
    SamplePath: "../../Views/Components/Sample/",
    MainPath: "../../Views/Components/",
};

var ExcetionInst = function (ExpType, Path, PageDesc, Msg, StackMsg) {
    return {
        ExceptionType: ExpType,
        Path: Path,
        Msgs: Msg,
        PageTitle: PageDesc,
        TraceStack: StackMsg
    };
}

var ExceptionType = {
    SessionTimeout: "SessionTimeout",
    AccessDenied: "AccessDenied",
    PageNotFound: "PageNotFound",
    ValidationError: "ValidationError",
    RestServiceError: "RestServiceError",
    Others: "Others"
};

var RoleType = {
    LoginUser: 0,
    Role: 1,
    Organization: 2
};

var msgBoxTemp;

//var WCFPath = "http://www.wellscom.net/";
var WCFPath = "http://localhost:7282/";

(function () {
    'use strict';

    var injectParams = [];

    var ShareDataModel = function () {

        var ExceptionData = {};

        var ShareDataModel = function () {
        }

        ShareDataModel.prototype = {
            SetExceptionData: function (data) {
                ExceptionData = data;
            },
            GetExceptionData: function () {
                return ExceptionData;
            }
        };
        return ShareDataModel;
    };

    ShareDataModel.$inject = injectParams;

    angular.module('CoolPrivilegeModel').factory('ShareDataModel', ShareDataModel);
})();

(function () {
    'use strict';

    var injectParams = [];

    var StaticContentModel = function () {
        function StaticContentModel() {

        };
        return StaticContentModel;
    };

    StaticContentModel.$inject = injectParams;

    angular.module('CoolPrivilegeModel').factory('StaticContentModel', StaticContentModel);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-route.js" />
(function () {
    'use strict';

    var injectParams = [];

    var SystemInfoVM = function () {
        function SystemInfoVM(LUData) {
            if (LUData) {
                this.setData(LUData);
            }
        };
        SystemInfoVM.prototype = {
            setData: function (LUData) {
                angular.extend(this, LUData);
            },
        };
        return SystemInfoVM;
    };

    SystemInfoVM.$inject = injectParams;

    angular.module('CoolPrivilegeModel').factory('SystemInfoVM', SystemInfoVM);

})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-route.js" />
(function () {
    'use strict';

    var injectParams = [];

    var WCFErrorContract = function () {
        function WCFErrorContract(data) {
            if (data) {
                this.setData(data);
            }
        };
        WCFErrorContract.prototype = {
            setData: function (data) {
                angular.extend(this, data);
            }
        };
        return WCFErrorContract;
    };

    WCFErrorContract.$inject = injectParams;

    angular.module('CoolPrivilegeModel').factory('WCFErrorContract', WCFErrorContract);

})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-route.js" />
(function () {
    'use strict';

    var injectParams = [];

    var WCFReturnResult = function () {
        function WCFReturnResult(data) {
            if (data) {
                this.setData(data);
            }
        };
        WCFReturnResult.prototype = {
            setData: function (data) {
                angular.extend(this, data);
            },
            HasError: function () {
                var scope = this;

                return !scope.IsSuccess;
            },
            GetErrMsgs: function () {
                var msgTxt = "";
                if (!angular.isUndefined(this.StrList_Error) && this.StrList_Error.length > 0) {
                    msgTxt = this.StrList_Error.join("<br/>");
                }
                return msgTxt;
            },
            HasMsgs: function () {
                if (!angular.isUndefined(this.StrList_Error) && this.StrList_Error.length > 0)
                    return true;
                else
                    return false;
            }
        };
        return WCFReturnResult;
    };

    WCFReturnResult.$inject = injectParams;

    angular.module('CoolPrivilegeModel').factory('WCFReturnResult', WCFReturnResult);

})();;/// <reference path="../Models/StaticContentModel.js" />
/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-route.js" />
(function () {
    var injectParams = ['$cookies', '$location', '$rootScope'];

    var ClientSessionMgt = function ($cookies, $location, $rootScope) {

        function ClientSessionMgt() {
            this.SessionInfo = {};
            this.SystemInfo = {};
            this.PageTitle = "";
            this.MsgsStr = "";
        };
        ClientSessionMgt.prototype = {
            SetUserInfo: function (json_SessionInfo) {
                var timeoutSeconds = 600;
                this.SystemInfo = $cookies.getObject(Keys.SystemInfo_CookiesKey);

                if (!angular.isUndefined(this.SystemInfo) && this.SystemInfo != null) {
                    timeoutSeconds = this.SystemInfo.SessionTimeoutSeconds;

                    this.SessionInfo = json_SessionInfo;
                    var expireDate = new Date();
                    expireDate.setSeconds(expireDate.getSeconds() + timeoutSeconds);
                    $cookies.putObject(Keys.SessionInfo_CookiesKey, json_SessionInfo, { 'expires': expireDate });
                }
            },
            GetUserInfo: function () {
                this.SessionInfo = $cookies.getObject(Keys.SessionInfo_CookiesKey);

                if (!angular.isUndefined(this.SessionInfo) && this.SessionInfo != null) {
                    //Refresh Session
                    this.SetUserInfo(this.SessionInfo);
                }
                else {
                    var currentPath = $location.path();
                    $rootScope.$emit(ExceptionType.SessionTimeout, { Path: currentPath, PageTitle: this.PageTitle, Msgs: this.MsgsStr });
                }

                return this.SessionInfo;
            },
            ClearUserInfo: function () {
                $cookies.remove(Keys.SessionInfo_CookiesKey);
            },
            GetSystemInfo: function () {
                this.SystemInfo = $cookies.getObject(Keys.SystemInfo_CookiesKey);

                if (angular.isUndefined(this.SystemInfo) || this.SystemInfo == null) {
                    var currentPath = $location.path();
                    $rootScope.$emit(ExceptionType.SessionTimeout, { Path: currentPath, PageTitle: this.PageTitle, Msgs: this.MsgsStr });
                }

                return this.SystemInfo;
            }
        };
        return ClientSessionMgt;
    };

    ClientSessionMgt.$inject = injectParams;

    angular.module('commonUtilities').factory('ClientSessionMgt', ClientSessionMgt);

})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-route.js" />

(function () {
    'use strict';

    var injectParams = ['$stateProvider'];

    var CustomStateProvider = function ($stateProvider) {
        return {
            AddState: function (Path, FunKey, FunType, resolveJson, ParmsStr) {
                var urlPath = '/' + (FunType ? FunType : FunKey);
                if (!angular.isUndefined(ParmsStr) && ParmsStr != null && ParmsStr != "") {
                    urlPath = urlPath + ParmsStr;
                }
                $stateProvider.state('Main.' + FunKey + (FunType ? "." + FunType : ""), {
                    url: urlPath,
                    views: {
                        'Content@Main': {
                            templateUrl: Path + FunKey + '/' + (FunType ? FunKey + '.' + FunType : FunKey) + '.tpl.html',
                            controller: FunKey + "Controller"
                        }
                    },
                    resolve: resolveJson
                });
            },
            ConfigState: function () {
                var initInjector = angular.injector(['ng']);
                var $http = initInjector.get('$http');
                var request = $http({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    },
                    url: WCFPath + 'FunMgtService.svc/GetAllFunWFunType',
                    data: {}
                });

                request.then(function (resp) {
                    if (resp != null && !angular.isUndefined(resp)) {
                        var entityList_FDInfo = resp.data;
                        for (var i = 0; i < entityList_FDInfo.EntityList_FunDetailInfo.length; ++i) {
                            var entity_FDInfo = entityList_FDInfo.EntityList_FunDetailInfo[i];
                            $stateProvider.state('Main.' + entity_FDInfo.FName, {
                                url: '/' + entity_FDInfo.FName,
                                views: {
                                    'Content@Main': {
                                        templateUrl: Path.FunsPath + entity_FDInfo.FName + '/' + entity_FDInfo.FName + '.tpl.html',
                                        controller: entity_FDInfo.FName + "Controller"
                                    }
                                }
                            });

                            for (var j = 0; j < entity_FDInfo.FTName.length; ++j) {
                                $stateProvider.state('Main.' + entity_FDInfo.FName + (entity_FDInfo.FTName[j] ? "." + entity_FDInfo.FTName[j] : ""), {
                                    url: '/' + (entity_FDInfo.FName ? entity_FDInfo.FName + '/' + entity_FDInfo.FTName[j] : entity_FDInfo.FName),
                                    views: {
                                        'Content@Main': {
                                            templateUrl: Path.FunsPath + entity_FDInfo.FName + '/' + (entity_FDInfo.FTName[j] ? entity_FDInfo.FName + '_' + entity_FDInfo.FTName[j] : entity_FDInfo.FName) + '.tpl.html',
                                            controller: entity_FDInfo.FName + "Controller"
                                        }
                                    }
                                });
                            }
                        }
                    }
                });
            },

            $get: function () {
                return {
                }
            }
        };
    };

    CustomStateProvider.$inject = injectParams;

    angular.module("commonUtilities").provider("CustomState", CustomStateProvider);
})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Models/StaticContentModel.js" />
/// <reference path="../Scripts/angular-route.js" />
(function () {
    var injectParams = ['$exceptionHandler'];

    var ExceptionHandler = function ($injector) {

        function ExceptionHandler(exception, cause) {
            var rScope = $injector.get('$rootScope');
            if (!angular.isUndefined(exception) && exception != null && angular.isObject(exception)) {
                if (!angular.isUndefined(exception.ExceptionType)) {
                    console.log(exception.PageTitle + ":" + exception.Msgs);
                    if (exception.ExceptionType == ExceptionType.SessionTimeout) {
                        rScope.$emit(ExceptionType.SessionTimeout, { Path: exception.Path, PageTitle: exception.PageTitle, Msgs: exception.Msgs });
                    }
                    else if (exception.ExceptionType == ExceptionType.AccessDenied) {
                        rScope.$emit(ExceptionType.AccessDenied, { Path: exception.Path, PageTitle: exception.PageTitle, Msgs: exception.Msgs });
                    }
                    else if (exception.ExceptionType == ExceptionType.ValidationError) {
                        rScope.$emit(ExceptionType.ValidationError, { Path: exception.Path, PageTitle: exception.PageTitle, Msgs: exception.Msgs });
                    }
                    else if (exception.ExceptionType == ExceptionType.RestServiceError) {
                        rScope.$emit(ExceptionType.RestServiceError, { Path: exception.Path, PageTitle: exception.PageTitle, Msgs: exception.Msgs, Stack: exception.TraceStack });
                    }
                }
                else {
                    console.log(exception.message + ":" + exception.stack);
                    rScope.$emit(ExceptionType.Others, { Stack: exception.stack, Msgs: exception.message, Cause: cause });
                }
            }
            else {
                console.log(exception);
                rScope.$emit(ExceptionType.Others, { Msgs: exception, Cause: cause });
            }
        };
        return ExceptionHandler;
    };
    ExceptionHandler.$inject = ['$injector'];

    angular.module('commonUtilities').factory('$exceptionHandler', ExceptionHandler);

})();;/// <reference path="../Scripts/angular.js" />
/// <reference path="../Scripts/angular-route.js" />
(function () {
    'use strict';

    var injectParams = ['$sessionStorage', '$q', 'ClientSessionMgt'];

    var WCFAuthInfoVM = function ($sessionStorage, $q, ClientSessionMgt) {
        var LoginID = "";
        function WCFAuthInfoVM() {
            this.WCFAuthorizedKey = "";
            this.WCFClientSessionKey = "";
            this.IpAddress = "";
            this.ClientName = "";
            this.RequestFunKey = "";
            this.RequestFunTypeKey = "";
            this.ClientLanguage = "";
        };
        WCFAuthInfoVM.prototype = {
            initData: function () {
                if (!angular.isUndefined($sessionStorage.SelectedLang) && $sessionStorage.SelectedLang != null && $sessionStorage.SelectedLang != "") {
                    this.ClientLanguage = $sessionStorage.SelectedLang;
                }

                var clientSessionMgt = new ClientSessionMgt();
                var resp = clientSessionMgt.GetUserInfo();
                if (!angular.isUndefined(resp) && resp != null) {
                    this.WCFAuthorizedKey = resp.WCFToken;
                    this.LoginID = resp.UserId;
                };
            },
            GetUserId: function () {
                return this.LoginID;
            },
            SetFunKeyAndTypeKey: function (str_FunKey, str_FunTypeKey) {
                this.RequestFunKey = str_FunKey;
                this.RequestFunTypeKey = str_FunTypeKey;
            }
        };
        return WCFAuthInfoVM;
    }
    WCFAuthInfoVM.$inject = injectParams;

    angular.module('commonUtilities').factory('WCFAuthInfoVM', WCFAuthInfoVM);

})();