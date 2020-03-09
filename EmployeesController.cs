using Dovetail.Client.BLL;
using Dovetail.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using Newtonsoft.Json;

using Dovetail.Client.Helpers;

using System.Configuration;
using System.Web.Configuration;
using System.Net.Configuration;

namespace Dovetail.Client.V3.Controllers
{
    [Authorize]
    public class EmployeesController : Controller
    {
        private readonly EmployeeService service;

        public EmployeesController()
        {
            service = new EmployeeService();
        }

        public RedirectResult UsedTempPassword()
        {
            return null;
        }

        public class ErrorMessage
        {
            public string Message { get; set; }
        }

        public struct ModelRequestPassword
        {
            public string UserName { get; set; }
            public string FirstName { get; set; }
            public string LastName { get; set; } 
        }

        [OutputCache(Duration = 1)]
        [AllowAnonymous]
        [HttpGet]
        public async Task<JsonResult> ForgotPassword(string email)
        {
            HttpResultObj httpResult = await service.ForgotPassword(email);
            if (httpResult.status != 200)
            {
                return Json(new { success = false, msg = httpResult.obj }, JsonRequestBehavior.AllowGet);
            }

            RequestPasswordResponse o = (RequestPasswordResponse)httpResult.obj;

            string fullName = o.FirstName + " " + o.LastName;

            bool sent = NetworkHelpers.SendEmail(email, fullName, "Your Temporary Password", 
                string.Format(@"
Hi {0},<br />
<br />
<br />
UserName: {1}<br />
Temporary Password: {2}<br />
<br />
<br />
Thank You,<br />
{3}<br />
<br />
<br />
", fullName,
 email,
 o.TemporaryPassword,
 System.Configuration.ConfigurationManager.AppSettings.Get("BASEURL")
 )
                );

            return Json(new { success = true, sent = sent }, JsonRequestBehavior.AllowGet);
        }

        [OutputCache(Duration = 1)]
        [HttpPost]
        public async Task<JsonResult> RequestPassword(ModelRequestPassword model)
        {
            if (!User.Identity.IsAuthenticated)
            {
                return Json(new { success = false, msg = "Only authenticated users can use this functionality." }, JsonRequestBehavior.AllowGet);
            }

            HttpCookie myCookie = Request.Cookies["AUTHH"];
            HttpResultObj httpResult = await service.RequestPassword(myCookie.Value, model.UserName);
            if (httpResult.status != 200)
            {
                return Json(new { success = false, msg = httpResult.obj }, JsonRequestBehavior.AllowGet);
            }

            //add SMTP function here

            string fullName= model.FirstName + " " + model.LastName;
            RequestPasswordResponse o = (RequestPasswordResponse)httpResult.obj;
            bool sent = NetworkHelpers.SendEmail(model.UserName, fullName, "Temporary Password of " + fullName,
string.Format(@"
Hi {0},<br />
<br />
<br />
UserName: {1}<br />
Temporary Password: {2}<br />
<br />
<br />
Thank You,<br />
{3}<br />
<br />
", fullName,
 model.UserName,
 o.TemporaryPassword,
 System.Configuration.ConfigurationManager.AppSettings.Get("BASEURL")
 )                
                );

            return Json(new { success = true, model=model, result = httpResult.obj, sent = sent }, JsonRequestBehavior.AllowGet);
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<JsonResult> GetCurrentUser()
        {
            var data = User.Identity.Name;
            return Json(new { success = true,  data=data }, JsonRequestBehavior.AllowGet);
        }

        [OutputCache(Duration = 1)]
        [HttpGet]
        public async Task<JsonResult> EmployeeDetailsByUserName()
        {
            string username = User.Identity.Name;

            HttpCookie myCookie = Request.Cookies["AUTHH"];

            HttpResultObj httpResult = await service.EmployeeDetailsByUsername(myCookie.Value, username);
            if (httpResult.status != 200)
            {
                return Json(new { success = false, username=username, msg = httpResult.obj }, JsonRequestBehavior.AllowGet);
            }
            return Json(new { success = true, username=username, empdetails = httpResult.obj }, JsonRequestBehavior.AllowGet);
        }

        [OutputCache(Duration = 1)]
        [HttpGet]
        public async Task<JsonResult> EmployeeDetails(string empid)
        {
            HttpCookie myCookie = Request.Cookies["AUTHH"];
            HttpResultObj httpResult = await service.EmployeeDetails(myCookie.Value, empid);
            if (httpResult.status != 200)
            {
                return Json(new { success = false, msg = httpResult.obj }, JsonRequestBehavior.AllowGet);
            }
            return Json(new { success = true, empdetails = httpResult.obj }, JsonRequestBehavior.AllowGet);
        }

        [OutputCache(Duration = 1)]
        [HttpGet]
        public async Task<JsonResult> TaxIDExists(string taxid)
        {
            HttpCookie myCookie = Request.Cookies["AUTHH"];
            HttpResultObj httpResult = await service.TaxIDExists(myCookie.Value, taxid);
            if (httpResult.status != 200)
            {
                return Json(new { success = false, msg = httpResult.obj }, JsonRequestBehavior.AllowGet);
            }
            return Json(new { success = true, taxid_exists = httpResult.obj }, JsonRequestBehavior.AllowGet);
        }
        
        [OutputCache(Duration = 1)]
        [HttpGet]
        public async Task<JsonResult> EmailExists(string email)
        {
            HttpCookie myCookie = Request.Cookies["AUTHH"];
            HttpResultObj httpResult = await service.EmailExists(myCookie.Value, email);
            if (httpResult.status != 200)
            {
                return Json(new { success = false, msg = httpResult.obj }, JsonRequestBehavior.AllowGet);
            }
            return Json(new { success = true, email_exists = httpResult.obj }, JsonRequestBehavior.AllowGet);
        }

        [OutputCache(Duration = 1)]
        [HttpGet]
        public async Task<JsonResult> PinExists(string pin)
        {
            HttpCookie myCookie = Request.Cookies["AUTHH"];
            HttpResultObj httpResult = await service.PinExists(myCookie.Value,pin);
            if (httpResult.status != 200)
            {
                return Json(new { success = false, msg = httpResult.obj }, JsonRequestBehavior.AllowGet);                
            }
            return Json(new { success = true, pin_exists = httpResult.obj }, JsonRequestBehavior.AllowGet);
        }

        [OutputCache(Duration = 1)]
        [HttpGet]
        public async Task<JsonResult> EmployeeNumberExists(string empnum)
        {
            HttpCookie myCookie = Request.Cookies["AUTHH"];
            HttpResultObj httpResult = await service.EmployeeNumberExists(myCookie.Value, empnum);
            if (httpResult.status != 200)
            {
                return Json(new { success = false, msg = httpResult.obj }, JsonRequestBehavior.AllowGet);
            }
            return Json(new { success = true, empnum_exists = httpResult.obj }, JsonRequestBehavior.AllowGet);
        }

        [OutputCache(Duration = 1)]
        [AllowAnonymous]
        [HttpGet]
        public async Task<JsonResult> ListComplexEmployeeByLocationID(int? id)
        {
            HttpCookie myCookie = Request.Cookies["AUTHH"];
            HttpResultObj httpResult = await service.ListComplexEmployeeByLocationID(id.Value, myCookie.Value);
            if (httpResult.status != 200)
            {
                return Json(new { success = false, msg = httpResult.obj }, JsonRequestBehavior.AllowGet);
            }

            return Json(new { success = true, data = httpResult.obj }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public async Task<JsonResult> Delete(int id)
        {
            HttpCookie myCookie = Request.Cookies["AUTHH"];
            HttpResultObj httpResult = await service.DeleteEmployee(id, myCookie.Value);
            if (httpResult.status == 200)
            {
                return Json(new { success = true});
            }
            return Json(new { success = false, msg = httpResult.obj });
        }

        public ActionResult Index()
        {
            return View();
        }

        [OutputCache(Duration = 1)]
        public ActionResult Update()
        {
            ViewBag.nocache = DateTime.Now;
            return View();
        }

        [OutputCache(Duration = 1)]
        public ActionResult Create()
        {
            return View();
        }

        [HttpPost]
        public async Task<JsonResult> CreateEmployee(ComplexEmployee model)
        {
            if (!ModelState.IsValid)
            {
                return Json(new { success = false, msg = ErrorHelpers.GetErrorListFromModelState(ModelState), model = model });
            }

            HttpCookie myCookie = Request.Cookies["AUTHH"];
            HttpResultObj httpResultObj = await service.CreateEmployee(myCookie.Value, model);
            if (httpResultObj.status != 200)
            {
                return Json(new { success = false, msg = httpResultObj.obj,model=model });
            }

            ComplexEmployee newEmp = (ComplexEmployee)httpResultObj.obj;

            bool sent = false;
            try
            {
               sent=NetworkHelpers.SendEmail(newEmp.UserName, newEmp.FirstName + " " + newEmp.LastName, "New Employee Added", string.Format(@"
Hi {0},<br />
<br />
<br />
UserName: {1}<br />
Temporary Password: {2}<br />
<br />
<br />
Thank You,<br />
{3}<br />
<br />
<br />
", newEmp.FirstName + " " + newEmp.LastName, 
 newEmp.UserName,
 newEmp.Password,
 System.Configuration.ConfigurationManager.AppSettings.Get("BASEURL")
 ));
            }
            catch (Exception)
            {

            };

            return Json(new { success = true, newEmp = newEmp , model = model,sent=sent });
        }

        [OutputCache(Duration = 1)]
        [AllowAnonymous]
        [HttpGet]
        public ActionResult EmpForm(int? jsTime)
        {
            ViewBag.nocache = jsTime;
            return View();
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<JsonResult> Details(int? empid)
        {
            HttpCookie myCookie = Request.Cookies["AUTHH"];
            HttpResultObj httpResult = await service.GetEmployeeDetails(myCookie.Value, empid.Value);
            if(httpResult.status!=200)
            {
                return Json(new { success = false, msg = httpResult.obj }, JsonRequestBehavior.AllowGet);
            }
            return Json(new { success = true, emp = httpResult.obj },JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public async Task<JsonResult> UpdateEmployee(ComplexEmployee model)
        {
            if (!ModelState.IsValid)
            {
                return Json(new { success = false, msg = ErrorHelpers.GetErrorListFromModelState(ModelState), model = model });
            }

            HttpCookie myCookie = Request.Cookies["AUTHH"];
            HttpResultObj httpResultObj = await service.UpdateEmployee(myCookie.Value, model);
            if(httpResultObj.status!=200)
            {
                return Json(new { success = false, msg = httpResultObj.obj, model=model });
            }
           
            return Json(new { success = true, updatedEmp = httpResultObj.obj, model = model });
           
        }

    }
}
