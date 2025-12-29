const adminRoute = require("./modules/Admin/Route/adminRoute.js");
const staffroute = require("./modules/Staff/Route/staffRoute.js");
const projectRoute = require("./modules/Projects/Route/projectRoute.js")
const copyRoute = require("./modules/copies/Route/FieldCopyRoute.js");
const customerRoute = require("./modules/Customer/Route/CustomerRoute.js");
const proposalRoute = require("./modules/Proposal/Route/proposalRoute.js");

module.exports = [
    {
        path : "/api/admin",
        handler : adminRoute,
        schema : 'Admin'
    },
    {
        path : "/api/staff",
        handler : staffroute,
        schema : 'Staff'
    },
    {
        path : "/api/project",
        handler : projectRoute,
        schema : 'Project'
    },
    {
        path : "/api/copy",
        handler : copyRoute,
        schema : 'Copy'
    },
    {
        path : "/api/customer",
        handler : customerRoute,
        schema : 'Customer'
    },
    {
        path : "/api/proposal",
        handler : proposalRoute,
        schema : 'Proposal'
    }
]