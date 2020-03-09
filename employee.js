
DMPApp.lazy.controller('employeeController',
        ['$scope', '$state', '$stateParams', '$http', 'utils', '$rootScope', '$cacheFactory', '$q', '$location', '$filter',
            function ($scope, $state, $stateParams, $http, utils, $rootScope, cacheFactory, $q, $location, $filter) {

                $scope.store = utils.findByBusinessName($scope.stores, $stateParams.storeName);
                $rootScope.setTitle($stateParams.storeName.toString().replace(/-+/g, " ").toLowerCase(), "employees");

                urlFormat = function (str) {
                    return str.toLowerCase().replace(/\s+/g, "-");
                }

                $scope.jsDateFormat = 'yyyy-MM-dd';//UTC format
                $scope.savingEmployee = false;
                initCache = function () {

                    if (typeof (storeCache) == 'undefined') {
                        storeCache = cacheFactory("store");
                    }

                    if (typeof (employeesCache) == 'undefined') {
                        employeesCache = cacheFactory("employees");
                    }

                    if (typeof (userCache) == 'undefined') {
                        userCache = cacheFactory("user");
                    }

                    if (typeof (jobTitlesCache) == 'undefined') {
                        jobTitlesCache = cacheFactory('jobtitles');
                    }
                }

                $scope.isLoading = true;
                $scope.filledViewLoading = false;
                $scope.filledView = {};//null;
                $scope.filledViewVisible = false;

                $scope.StoreName = $stateParams.storeName;
                $scope.EmployeeName = $stateParams.employeeName;
                $scope.jobtitles = null;

                $scope.activeJob = null;
                $scope.activeEmployee = null;

                //init
                $scope.invalidPIN = false;
                $scope.invalidEmpNum = false;
                $scope.invalidTaxID = false;
                $scope.gotDuplicateEmails = false;//duplicate emails 1 and 2
                $scope.email1Exists = false;//email used by someone else as username/email1
                $scope.email2Exists = false;//email used by someone else as username/email2

                //previous record for edit mode
                $scope.prevPIN = '';
                $scope.prevEmpNum = '';
                $scope.prevEmail1 = '';
                $scope.prevEmail2 = '';
                $scope.prevTaxID = '';

                $scope.mode = null;

                getAllComplexJobTitles = function () {

                    //All of Customers' complexJobTitles
                    $scope.allComplexJobTitles = [];

                    $scope.isLoading = true;
                    $scope.allComplexJobTitles = [];//clear before fetching
                    $http.get('/JobTitle/ListComplexJobTitle').success(function (data) {
                        $scope.allComplexJobTitles = data.complexjobtitles;

                        initCache();
                        jobTitlesCache.put("jobtitles", $scope.allComplexJobTitles);

                        $scope.isLoading = false;
                    });

                }

                getTimeNow = function () {
                    return new Date().getTime();
                }

                getUserEmpDetails = function () {
                    $scope.userEmpDetails = null;//init

                    $http.get('/Employees/EmployeeDetailsByUserName/').success(function (data) {
                        if (!data.success) {
                            toastr.error("Failed to fetch logged-in user details. Please contact the support");
                        }
                        if (data.empdetails != null) {

                            var empdetails = data.empdetails;

                            //format the dates

                            if (empdetails.EmployeeJobTitle != null) {
                                empdetails.EmployeeJobTitle.DateTimeModified = getJsJSONDate(empdetails.EmployeeJobTitle.DateTimeModified);
                                empdetails.EmployeeJobTitle.StartDateTime = getJsJSONDate(empdetails.EmployeeJobTitle.StartDateTime);
                                empdetails.EmployeeJobTitle.EndDateTime = getJsJSONDate(empdetails.EmployeeJobTitle.EndDateTime);
                            }

                            if (empdetails.EmployeeLocation != null) {
                                empdetails.EmployeeLocation.StartDateTime = getJsJSONDate(empdetails.EmployeeLocation.StartDateTime);
                                empdetails.EmployeeLocation.EndDateTime = getJsJSONDate(empdetails.EmployeeLocation.EndDateTime);
                            }

                            $scope.userEmpDetails = empdetails;
                            log($scope.userEmpDetails);

                        } else {
   
                        }

                        initCache();
                        userCache.put("user", $scope.userEmpDetails);

                        $scope.isLoading = false;

                    }).error(function () {
                        $scope.isLoading = false;
                    });

                }

                 /* PIN */

                $scope.onBlurPIN2 = function (pin) {

                    if (typeof pin == 'undefined') {
                        $('#empForm input[name=PIN]').next().next('span.reqField').show();
                        return;
                    }

                    //on edit mode, check if the previous pin is just the same
                    //so there's no need to verify
                    if ($scope.mode == 'edit') {
                        if ($scope.prevPIN == $scope.emp.PIN) {
                            $('#PINStatus').hide();
                            $scope.invalidPIN = false;
                            return;
                        }
                    }

                    $scope.invalidPIN = true;
                    $http.get('/Employees/PinExists?pin=' + pin).success(function (data) {
                        if (!data.success) return;
                        if (data.pin_exists) {
                            $('#PINStatus').show();
                            $scope.invalidPIN = true;
                        } else $scope.invalidPIN = false;
                    }).error(function (data) {
                    });

                }

                $scope.onChangePIN2 = function (pin) {
                    if (pin == null) {
                        $('#empForm input[name=PIN]').next().next('span.reqField').show();
                    } else {

                        $('#empForm input[name=PIN]').next().next('span.reqField').hide();
                    }
                    $('#PINStatus').hide();
                }

                /* EmployeeNumber */

                $scope.onBlurEmpNum2 = function (empnum) {
                    if (typeof empnum == 'undefined') {
                        $('#empForm input[name=EmployeeNumber]').next().next('span.reqField').show();
                        return;
                    }
                    //on edit mode, check if the previous value is just the same
                    //so there's no need to verify
                    if ($scope.mode == 'edit') {
                        if ($scope.prevEmpNum == $scope.emp.EmployeeNumber) {
                            $('#empNumStatus').hide();
                            $scope.invalidEmpNum = false;
                            return;
                        }
                    }

                    $scope.invalidEmpNum = true;
                    $http.get('/Employees/EmployeeNumberExists?empnum=' + empnum).success(function (data) {
                        if (!data.success) return;
                        if (data.empnum_exists) {
                            $('#empNumStatus').show();
                            $scope.invalidEmpNum = true;
                        } else $scope.invalidEmpNum = false;
                    }).error(function (data) {

                    });
                }

                $scope.onChangeEmpNum2 = function (empnum) {
                    if (empnum == null) {
                        $('#empForm input[name=EmployeeNumber]').next().next('span.reqField').show();
                    } else {
                        $('#empForm input[name=EmployeeNumber]').next().next('span.reqField').hide();
                    }
                    $('#empNumStatus').hide();
                }

                /* TaxID */

                $scope.onBlurTaxID = function (taxid) {

                    if (typeof taxid == 'undefined' || taxid == null || taxid == '') {
                        $scope.invalidTaxID = false;
                        return;
                    }

                    //on edit mode, check if the previous value is just the same
                    //so there's no need to verify
                    if ($scope.mode == 'edit') {
                        if ($scope.prevTaxID == $scope.emp.TaxID) {
                            $('#TaxIDStatus').hide();
                            $scope.invalidTaxID = false;
                            return;
                        }
                    }

                    $scope.invalidTaxID = true;
                    $http.get('/Employees/TaxIDExists?taxid=' + taxid).success(function (data) {
                        if (!data.success) return;
                        if (data.taxid_exists) {
                            $('#TaxIDStatus').show();
                            $scope.invalidTaxID = true;
                        } else { $scope.invalidTaxID = false; log('...no,you can use this.'); }
                    }).error(function (data) {
                    });

                }

                $scope.onChangeTaxID = function (taxid) {
                    if (taxid == null) {
                        $scope.invalidTaxID = false;
                    } else {
                    }
                    $('#TaxIDStatus').hide();
                }


                $scope.validEmail = function (emailAddress) {
                    var pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
                    return pattern.test(emailAddress);
                }

                $scope.checkEmail = function (elName) {
                    $scope.onBlurEmailField(elName);
                    $scope.isEmailExists(elName);

                    //showEmailValidation();
                }

                $scope.onBlurEmailField = function (elName) {
                    var $el = $('#empForm').find('input[name=' + elName + ']');
                    if (!$el.val().length) { $el.next().next('span').hide(); return; }
                    if (!$scope.validEmail($el.val())) { $el.next().next('span').show(); return; }
                    gotDupEmails();
                }

                var gotDupEmails = function () {
                    $scope.gotDuplicateEmails = false;

                    if (!$scope.validEmail($scope.emp.Email1)) return false;
                    if (!$scope.validEmail($scope.emp.Email2)) return false;
                    //both emails are valid, now check if they're the same
                    if ($scope.emp.Email1 == $scope.emp.Email2) {
                        $('#dupEmailMsg').show();
                        $scope.gotDuplicateEmails = true;
                        return true;
                    } else {
                        $('#dupEmailMsg').hide();
                        $scope.gotDuplicateEmails = false;
                        return false;
                    }
                }

                $scope.onChangeEmailField = function (elName) {
                    log('onChangeEmailField(' + elName + ')');
                    var $el = $('#empForm').find('input[name=' + elName + ']');

                    $el.next().next('span').hide();
                    $('span.emailExists[name=' + elName + ']').hide();
                    $('#dupEmailMsg').hide();

                    if ($el.val() == '') {
                        log(elName + ' is empty');
                        switch (elName) {
                            case 'Email1': $scope.email1Exists = false; break;
                            case 'Email2': $scope.email2Exists = false; break;
                        }
                    }

                    gotDupEmails();
                }

                var showEmailValidation = function () {
                    console.log('gotDuplicateEmails=' + $scope.gotDuplicateEmails);
                    console.log('email1Exists=' + $scope.email1Exists);
                    console.log('email2Exists=' + $scope.email2Exists);
                }

                $scope.isEmailExists = function (elName) {
                    log('isEmailExists(' + elName + ')');

                    //on edit mode, check if the previous email is just the same
                    //so there's no need to verify
                    if ($scope.mode == 'edit') {

                        if (isPreviousEmail(elName)) {
                            $('span.emailExists[name=' + elName + ']').hide();
                            //$scope.emailExists = false;
                            switch (elName) {
                                case 'Email1':
                                    $scope.email1Exists = false;
                                    break;
                                case 'Email2':
                                    $scope.email2Exists = false;
                                    break;
                            }
                            return;
                        }
                    }

                    $http.get('/Employees/EmailExists?email=' + $('input[name=' + elName + ']').val()).success(function (data) {
                        if (!data.success) return;
                        if (data.email_exists) {
                            $('span.emailExists[name=' + elName + ']').show();
                            log(elName + ' exists');
                            switch (elName) {
                                case 'Email1':
                                    $scope.email1Exists = true;
                                    break;
                                case 'Email2':
                                    $scope.email2Exists = true;
                                    break;
                            }

                        } else {
                            $('span.emailExists[name=' + elName + ']').hide();
                            log(elName + ' not found');
                            switch (elName) {
                                case 'Email1':
                                    $scope.email1Exists = false;
                                    break;
                                case 'Email2':
                                    $scope.email2Exists = false;
                                    break;
                            }
                        }
                    }).error(function (data) {
                        log(data);
                    });

                }

                var isPreviousEmail = function (elName) {
                    var email = $('input[name=' + elName + ']').val();
                    if (email == $scope.prevEmail1 || email == $scope.prevEmail2) {
                        log('current email value is one of the previous email');
                        return true;
                    } else return false;
                }

                $scope.onFocusReqField2 = function (elName) {
                    var $el = $('#empForm').find('input[name=' + elName + ']');
                    if ($el.val().length) {
                        $el.next().next('span.reqField').hide();
                    } else {
                        $el.next().next('span.reqField').show();
                    }
                }

                $scope.onFocusReqField = function (event) {
                    var $el = $(event.target);
                    log($el); log($el.val());
                    if ($el.val().length) {
                        $el.next().next('span.reqField').hide();
                    } else {
                        $el.next().next('span.reqField').show();
                    }
                }

                $scope.onChangeReqField2 = function (elName) {// (event,val) {
                    var $el = $('#empForm').find('input[name=' + elName + ']');
                    if (!$el.val().length) {
                        $el.next().next('span.reqField').show();
                    } else {
                        $el.next().next('span.reqField').hide();
                    }
                }

                $scope.onChangeReqField = function (event) {
                    var $el = $(event.target);
                    log($el); log($el.val());
                    var len = $el.val().length;
                    if (len) {
                        $el.next().next('span.reqField').hide();
                    } else {
                        $el.next().next('span.reqField').show();
                    }
                    return;

                    if (!angular.isObject(event)) return;
                    log(event);
                    if (!angular.isObject(event.target)) return;
                    var $el = $(event.target);
                    log($el);
                    log($el.val());
                    if ($el.val()) return;
                    log($el.next().next('span.reqField').show());

                }

                $scope.onBlurReqField2 = function (elName) {
                    var $el = $('#empForm').find('input[name=' + elName + ']');
                    if ($el.val().length) return;
                    $el.next().next('span.reqField').show()
                }


                $scope.onBlurReqField = function (event) {
                    var $el = $(event.target);
                    log($el); log($el.val());
                    if ($el.val()) return;
                    log($el.next().next('span.reqField').show());
                }

                $scope.filledViewLoaded = function () {
                    log("form loaded")
                    //reinit
                    $('[data-role=input-control], .input-control').inputControl();
                    $('[data-hint]').hint();
                    $('[data-role=scrollbox]').scrollbar();
                    $scope.filledViewLoading = false;
                    $("html, body").animate({ scrollTop: $("#formPane").offset().top - 60 }, 600);
                }

                $scope.testJsDate = function () {
                    var dotnetDate = $('#dotnetDate').val();
                    if (dotnetDate == null) return null;
                    var dt = new Date(parseInt(dotnetDate.replace("/Date(", "").replace(")/", ""), 10));
                    // gives you back 2012-04-11T15:46:29+00:00 in a slightly different format, but the timezone info matches UTC/GMT+0
                    return dt;
                }

                var getJsDate = function (dotnetDate) {
                    if (dotnetDate == null) return null;
                    var dt = new Date(parseInt(dotnetDate.replace("/Date(", "").replace(")/", ""), 10));
                    return dt;
                }

                var getJsJSONDate = function (dotnetDate) {
                    if (dotnetDate == null) return null;
                    var d = getJsDate(dotnetDate);
                    if (d == null) return null;
                    d = d.toJSON();
                    return d;
                }

                var getJsDateFormat = function (dotnetDate, format) {
                    if (dotnetDate == null) return null;
                    var dt = getJsDate(dotnetDate);
                    if (dt == null) return null;
                    var dtUTC = toUTCDate(dt);
                    return $filter('date')(dtUTC, format);
                }

                var toUTCDate = function (date) {
                    var _utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
                    return _utc;
                };

                $scope.initForm = function () {
                    $(function () {
                        var $frm = $("#empForm");
                        $.scrollTo('#formPane');
                        var x = 0;
                        $('form[name=empForm] table tr td:nth-child(even)').each(function () {
                            $(this).find('input:not([readonly]),select,textarea').attr('tabindex', x);
                        });

                        //focus 1st input
                        $('form[name=empForm] table tr td:nth-child(1) input').focus();
                        $frm.find('input.nameFld').keyfilter(/[a-zA-Z ]/);
                        $frm.find("input.numFld").numericInput();
                        $frm.find("input.floatFld").numericInput({ allowFloat: true });
                        $frm.find("input[name=TaxID]").mask("999-99-9999");
                        $frm.find("input.phoneFld").mask("(999) 999-9999");//no extension numbers
                    });

                }

                $scope.show_employee = function (emp) {
                    log('show_employee()');
                    angular.forEach($scope.employees, function (m) {
                        if (m.EmployeeID == emp.EmployeeID) {
                            m.isActive = true;
                        } else m.isActive = false;
                    });
                }

                jobTitlesCacheOrAjaxData = function () {
                    initCache();
                    $scope.allComplexJobTitles = jobTitlesCache.get("jobtitles");
                    if ($scope.allComplexJobTitles == null || $scope.allComplexJobTitles.length == 0) getAllComplexJobTitles();
                    else log('using jobTitlesCache');
                }

                $scope.show_employee_now = function (emp) {
                    $scope.isLoading = true;
                    $scope.filledViewLoading = true;
                    jobTitlesCacheOrAjaxData();
                    $scope.mode = 'edit';
                    $scope.btnSaveTxt = 'Update';
                    $scope.filledView.url = '/Employees/EmpForm/' + getTimeNow();
                    $scope.emp = emp;
                    $scope.prevPIN = emp.PIN;
                    $scope.prevEmpNum = emp.EmployeeNumber;
                    $scope.prevTaxID = emp.TaxID;
                    $scope.prevEmail1 = emp.Email1;
                    $scope.prevEmail2 = emp.Email2;
                    if (emp.EmployeeJobTitle != null) {
                        $scope.emp.EmployeeJobTitle.EndDateTime = null;
                    }
                    $scope.isLoading = false;
                    $scope.filledViewLoading = false;
                }

                $scope.show_newEmployee = function () {

                }


                $scope.show_newEmployee_now = function () {
                    $scope.isLoading = true;
                    $scope.filledViewLoading = true;
                    $scope.filledView = {};
                    jobTitlesCacheOrAjaxData();
                    $scope.mode = 'add';
                    $scope.btnSaveTxt = 'Create';
                    $scope.filledView.url = '/Employees/EmpForm/' + getTimeNow();
                    $scope.emp = {};
                    //init
                    $scope.prevPIN = '';
                    $scope.prevEmpNum = '';
                    $scope.prevTaxID = '';
                    $scope.prevEmail1 = '';
                    $scope.prevEmail2 = '';

                    $scope.emp.EmployeeID = null;
                    $scope.emp.CustomerID = $scope.location.CustomerID;// use the cache $scope.CustomerID;

                    $scope.emp.EmployeeLocation = {
                        "EmployeeLocationID": null,
                        "EmployeeID": null,
                        "LocationID": $scope.location.LocationID,//$scope.LocationID,
                        "StartDateTime": null,//required. use StateStart before posting //"2013-11-23T00:00:00+08:00",//required
                        "EndDateTime": null
                    };

                    $scope.emp.EmployeeJobTitle = {
                        "EmployeeJobTitleID": null,
                        "EmployeeID": null,
                        //use the current user's jobtitle
                        "JobTitleID": $scope.userEmpDetails.EmployeeJobTitle.JobTitleID,
                        "SalaryTypeID": null,
                        "HourlyRate": null,//required
                        "StartDateTime": null,//required. please use StartDate before saving
                        "EndDateTime": null,//nullable. implement when termination date field is shown
                        //use the current user's salary type    
                        "SalaryType": $scope.userEmpDetails.EmployeeJobTitle.SalaryType
                    };

                    $scope.emp.TrainingMode = false;
                    $scope.emp.DateOfBirth = null;
                    $scope.emp.StartDate = null;
                    $scope.emp.TerminatedDate = null;

                    $scope.isLoading = false;
                    $scope.filledViewLoading = false;
                }

                var validInputs = function () {
                    log('validating...');

                    if (!$scope.empForm.valid) return false;
                    else return true;
                };

                var formatToJsDates = function (emp) {

                    //format the dates

                    emp.StartDate = getJsDateFormat(emp.StartDate, $scope.jsDateFormat);
                    emp.TerminatedDate = getJsDateFormat(emp.TerminatedDate, $scope.jsDateFormat);
                    emp.DateOfBirth = getJsDateFormat(emp.DateOfBirth, $scope.jsDateFormat);

                    if (emp.EmployeeJobTitle != null) {
                        emp.EmployeeJobTitle.DateTimeModified = getJsJSONDate(emp.EmployeeJobTitle.DateTimeModified);
                        emp.EmployeeJobTitle.StartDateTime = getJsJSONDate(emp.EmployeeJobTitle.StartDateTime);
                        emp.EmployeeJobTitle.EndDateTime = getJsJSONDate(emp.EmployeeJobTitle.EndDateTime);
                    }

                    if (emp.EmployeeLocation != null) {
                        emp.EmployeeLocation.StartDateTime = getJsJSONDate(emp.EmployeeLocation.StartDateTime);
                        emp.EmployeeLocation.EndDateTime = getJsJSONDate(emp.EmployeeLocation.EndDateTime);
                    }

                    //return emp;
                }

                $scope.saveEmployee = function () {
                    delete $scope.emp.isActive;
                    var ajaxUrl = '';
                    if ($scope.mode == 'add') {
                        ajaxUrl = '/Employees/CreateEmployee';
                        $scope.emp.Password = null;
                    } else if ($scope.mode == 'edit') {
                        ajaxUrl = '/Employees/UpdateEmployee';
                        $scope.emp.Password = null;//'123456';
                    } else {
                        toastr.error('Invalid mode. Please contact the support');
                        return;
                    }

                    $scope.savingEmployee = true;

                    var input = {};

                    input.EmployeeID = $scope.emp.EmployeeID;
                    input.CustomerID = $scope.emp.CustomerID;
                    input.EmployeeNumber = $scope.emp.EmployeeNumber;
                    input.LastName = $scope.emp.LastName;
                    input.FirstName = $scope.emp.FirstName;
                    input.MiddleName = $scope.emp.MiddleName;
                    input.Address1 = $scope.emp.Address1;
                    input.Address2 = $scope.emp.Address2;
                    input.City = $scope.emp.City;
                    input.StateProvCode = $scope.emp.StateProvCode;
                    input.PostalCode = $scope.emp.PostalCode;
                    input.HomePhone = $scope.emp.HomePhone;
                    input.CellPhone = $scope.emp.CellPhone;
                    input.Email1 = $scope.emp.Email1;
                    input.Email2 = $scope.emp.Email2;
                    input.TaxID = $scope.emp.TaxID;
                    input.Gender = $scope.emp.Gender;
                    input.TrainingMode = false;
                    input.PIN = $scope.emp.PIN;
                    input.UserName = $scope.emp.UserName != null ? $scope.emp.UserName : $scope.emp.Email1;
                    input.Password = null;
                    input.DefaultLocaleID = $scope.emp.DefaultLocaleID;

                    if ($scope.emp.EmployeeJobTitle == null) input.EmployeeJobTitle = {};
                    else input.EmployeeJobTitle = $scope.emp.EmployeeJobTitle;

                    if ($scope.emp.EmployeeLocation == null) input.EmployeeLocation = {};
                    else input.EmployeeLocation = $scope.emp.EmployeeLocation;

                    //set datetimemodified to null. server will handle
                    if (input.EmployeeJobTitle != null) input.EmployeeJobTitle.DateTimeModified = (new Date()).toJSON();

                    //date fields

                    //required
                    var startdate = $('#StartDate').datepicker('getDate');
                    input.StartDate = $scope.emp.StartDate;
                    //optional dates
                    input.TerminatedDate = null;//for now
                    var dateOfBirth = $('#DateOfBirth').datepicker('getDate');
                    input.DateOfBirth = $scope.emp.DateOfBirth;
                    var jtID = $('#jobtitle option:selected').val();
                    switch ($scope.mode) {
                        case 'add':
                            input.EmployeeJobTitle.StartDateTime = input.StartDate;
                            input.EmployeeJobTitle.JobTitleID = jtID
                            input.EmployeeLocation.StartDateTime = input.StartDate;
                            break;
                        case 'edit':
                            input.EmployeeJobTitle.StartDateTime = input.StartDate;
                            input.EmployeeJobTitle.JobTitleID = jtID
                            input.EmployeeLocation.StartDateTime = input.StartDate;
                            break;
                        default:
                            toastr.error('Invalid mode. Please contact the support');
                            return;
                            break;
                    }

                    $http({
                        method: 'POST',
                        url: ajaxUrl,
                        data: JSON.stringify(input),
                        headers: { 'Content-Type': 'application/json; charset=utf-8' }
                    }).success(function (data) {
                        log(data);
                        $scope.savingEmployee = false;
                        if (!data.success) {
                            if (data.msg.length) {
                                for (var c = 0; c < data.msg.length; c++) {
                                    toastr.error(data.msg[c]);
                                }
                                return;
                            } else {
                                if (data.msg.Message != 'undefined') { toastr.error(data.msg.Message); return; }
                                if (data.msg != 'undefined') { toastr.error(data.msg); return; }
                            }
                            return;
                        }

                        switch ($scope.mode) {
                            case 'add':
                                toastr.success("New employee created");
                                if (data.newEmp != 'undefined') {
                                    if ($scope.employees == null) $scope.employees = [];
                                    formatToJsDates(data.newEmp);
                                    $scope.employees.push(data.newEmp);
                                    initCache();
                                    employeesCache.put("employees", $scope.employees);
                                    if (data.sent) {
                                        toastr.success("The temporary password was sent to " + data.newEmp.UserName);
                                    }

                                } else {
                                    toastr.error("Something went wrong with the returned data. Please contact the support.");
                                }
                                window.location = '#/stores/' + urlFormat($scope.location.BusinessName) + '/employees';
                                break;

                            case 'edit':
                                toastr.success("Employee updated");
                                if (data.updatedEmp != 'undefined') {
                                    angular.forEach($scope.employees, function (m) {
                                        if (m.EmployeeID == $scope.emp.EmployeeID) {
                                            formatToJsDates(data.updatedEmp);
                                            angular.extend(m, data.updatedEmp);
                                            $scope.emp = data.updatedEmp;
                                        }
                                    });
                                }

                                initCache();
                                employeesCache.put("employees", $scope.employees);
                                window.location = '#/stores/' + urlFormat($scope.location.BusinessName) + '/employees';
                                break;

                        }

                        $scope.filledView = {};
                        $scope.mode = null;

                    }).error(function (data, status, headers, config) {
                        $scope.savingEmployee = false;
                        toastr.error("Server error: Failed to process data");
                    });

                    $scope.isLoading = false;
                };

                $scope.delete_employee = function (id, index) {

                    log(JSON.stringify({ id: id }));

                    //if (confirm("Are you sure you want to delete this employee?") == false) return;

                    $http({
                        method: 'POST',
                        url: '/Employees/Delete',
                        data: JSON.stringify({ id: id }),
                        headers: { 'Content-Type': 'application/json; charset=utf-8' }
                    }).success(function (data) {
                        if (!data.success) {
                            toastr.error("Failed to delete employee: " + data.msg);
                            return;
                        }

                        $scope.employees.splice(index, 1);//remove current index

                        toastr.success('Deleted employee');

                        initCache();
                        employeesCache.put("employees", $scope.employees);

                        //getEmployees();
                        window.location = '#/stores/' + urlFormat($scope.location.BusinessName) + '/employees';

                    }).error(function () {
                        toastr.error("Server error: Failed to delete employee");
                    });

                }

                resetEmployeeSelection = function () {
                    //reset edit button color
                    if ($scope.employees != null && $scope.employees.length != 0) {
                        angular.forEach($scope.employees, function (m) {
                            m.isActive = false;
                        });
                    }
                }

                $scope.request_password = function (emp) {

                    yepnope({
                        load: '/App/Scripts/ajax-request-pwd.js?t=' + getTimeNow(),
                        complete: function () {
                            var jInput = {
                                UserName: emp.UserName,
                                FirstName: emp.FirstName,
                                LastName: emp.LastName
                            };
                            data = Routine.request_password($http, jInput);
                        }
                    });
                }

                return;
                initCache();


                if (storeCache.get("prevStore") == null) {
                    storeCache.put("prevStore", storeCache.put($scope.store));
                    listComplexEmpByLocationID();

                } else {

                    if ($scope.store.LocationID != storeCache.get("prevStore").LocationID) {
                        storeCache.put("prevStore", $scope.store);
                        listComplexEmpByLocationID();

                    } else {

                        $scope.employees = employeesCache.get("employees");
                        if ($scope.employees == null) {

                        } else {

                            resetEmployeeSelection();
                            $scope.isLoading = false;
                        }
                    }

                }

            }]);

