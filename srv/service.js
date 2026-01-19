const cds = require('@sap/cds');
 
module.exports = cds.service.impl(async function () {
    const { Parents,Students,Fees  } = this.entities;

    this.before("CREATE",  Parents.drafts,(req) => {
        debugger
        const random = Math.floor(1 + Math.random() * 1000);
        req.data.ParentId = `P${random}`
    })

    this.before("CREATE",  Students.drafts,(req) => {
        debugger
        const random = Math.floor(1 + Math.random() * 1000);
        req.data.StudentId = `S${random}`
    })
    
this.before("CREATE",  Fees.drafts,(req) => {
        debugger
        const random = Math.floor(1 + Math.random() * 1000);
        req.data.FeeId = `F${random}`
    })
    
})