sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageBox) {
    "use strict";

    return Controller.extend("registration.controller.View1", {

        onInit: function () {
            this.getView().setModel(new JSONModel({
                student: {
                    firstName: "",
                    lastName: "",
                    dob: "",
                    gender: "",
                    grade: ""
                },
                parent: {
                    fatherName: "",
                    motherName: "",
                    mobile: "",
                    address: ""
                },
                fees: {
                    feeType: "",
                    amount: "",
                    paymentStatus: "",
                    receipts: []
                },
                uploadBusy: false,
                showStep2: false,
                showStep3: false,
                showPreview: false,
                showSubmit: false
            }), "wizard");
        },

        /* ================= WIZARD NAVIGATION ================= */

        onStudentChange: function () {
            const m = this.getView().getModel("wizard").getProperty("/student");
            this.getView().getModel("wizard").setProperty(
                "/showStep2",
                !!m.firstName && !!m.dob && !!m.gender
            );
        },

        onStudentNext: function () {
            this.byId("studentStep").setValidated(true);
            this.byId("registrationWizard").nextStep();
        },

        onParentChange: function (oEvent) {
            const oModel = this.getView().getModel("wizard");
            const sPath = oEvent.getSource().getBindingInfo("value").binding.getPath();
            oModel.setProperty("/parent/" + sPath.split("/").pop(), oEvent.getParameter("value"));

            const p = oModel.getProperty("/parent");
            oModel.setProperty(
                "/showStep3",
                p.fatherName && p.motherName && /^\d{10}$/.test(p.mobile)
            );
        },

        onParentNext: function () {
            this.byId("parentStep").setValidated(true);
            this.byId("registrationWizard").nextStep();
        },

        onFeesChange: function () {
            var oModel = this.getView().getModel("wizard");
            var oFees = oModel.getProperty("/fees");

            var bValid =
                !!oFees.feeType &&
                !!oFees.amount &&
                !!oFees.paymentStatus &&
                oFees.receipts.length > 0;

            oModel.setProperty("/showPreview", bValid);
        },

        onFeesNext: function () {
            var oWizard = this.byId("registrationWizard");
            var oModel = this.getView().getModel("wizard");

            // mark Fees step valid
            oWizard.validateStep(this.byId("feesStep"));

            // show submit button
            oModel.setProperty("/showSubmit", true);

            // ✅ FORCE navigation to Preview
            oWizard.setCurrentStep(this.byId("previewStep"));
        },

        onReceiptChange: function (oEvent) {
    const oModel = this.getView().getModel("wizard");

    // 🔵 SHOW pending bar
    oModel.setProperty("/uploadBusy", true);

    const files = oEvent.getSource().getDomRef("fu").files;
    const a = oModel.getProperty("/fees/receipts");

    // simulate upload (keep as-is for now)
    setTimeout(() => {

        Array.from(files).forEach(f => a.push({
            fileName: f.name,
            url: URL.createObjectURL(f)
        }));

        oModel.setProperty("/fees/receipts", a);
        oEvent.getSource().setValue("");

        // 🔵 HIDE pending bar
        oModel.setProperty("/uploadBusy", false);

        this.onFeesChange();

    }, 600); // small delay so user sees pending
},

        onPreviewReceipt: function (oEvent) {
            const oItem = oEvent.getSource().getParent().getParent();
            const oContext = oItem.getBindingContext("wizard");
            const sUrl = oContext.getProperty("url");

            if (sUrl) {
                window.open(sUrl, "_blank");
            } else {
                sap.m.MessageToast.show("No file to preview!");
            }
        },


        onDeleteReceipt: function (oEvent) {
            const idx = oEvent.getSource().indexOfItem(oEvent.getParameter("listItem"));
            const oModel = this.getView().getModel("wizard");
            const a = oModel.getProperty("/fees/receipts");
            a.splice(idx, 1);
            oModel.setProperty("/fees/receipts", a);
            this.onFeesChange();
        },


        onSaveDraftPress: function () {
            this.onSaveDraft(false); // ✅ SHOW POPUP
        },

        onSaveDraft: async function (bSilent) {
            const oOData = this.getOwnerComponent().getModel();
            const oWizard = this.getView().getModel("wizard").getData();

            try {
                const oParentList = oOData.bindList("/Parents");

                const oParentCtx = oParentList.create({
                    FatherName: oWizard.parent.fatherName,
                    MotherName: oWizard.parent.motherName,
                    MobileNumber: oWizard.parent.mobile,
                    Address: oWizard.parent.address
                });

                await oParentCtx.created();

                const oStudentList = oOData.bindList("ParentstoStudents", oParentCtx);
                const oStudentCtx = oStudentList.create({
                    FirstName: oWizard.student.firstName,
                    LastName: oWizard.student.lastName,
                    DateOfBirth: oWizard.student.dob,
                    Gender: oWizard.student.gender,
                    Grade: oWizard.student.grade
                });

                await oStudentCtx.created();

                const oFeesList = oOData.bindList("StudentstoFees", oStudentCtx);
                for (const r of oWizard.fees.receipts || []) {
                    await oFeesList.create({
                        FeeType: oWizard.fees.feeType,
                        Amount: oWizard.fees.amount,
                        PaymentStatus: oWizard.fees.paymentStatus,
                        Receipts: r.fileName
                    }).created();
                }

                this.getView().setBindingContext(oParentCtx);

                // ✅ SHOW MESSAGE ONLY IF USER CLICKED "SAVE DRAFT"
                if (!bSilent) {
                    sap.m.MessageBox.information("Draft saved successfully");
                }

            } catch (e) {
                console.error(e);
                sap.m.MessageBox.error("Draft save failed");
            }
        },


        /* ================= SUBMIT ================= */

        onSubmit: async function () {
            const oView = this.getView();
            const oOData = this.getOwnerComponent().getModel();
            let oCtx = oView.getBindingContext(); // Parent context

            try {

                /* =========================
                   CASE 1️⃣ : DRAFT EXISTS
                   ========================= */
                if (oCtx && oCtx.getProperty("IsActiveEntity") === false) {

                    await oCtx.getModel()
                        .bindContext(oCtx.getPath() + "/My.draftActivate(...)")
                        .execute();

                    sap.m.MessageBox.confirm(
                        "Do you want to confirm Registration ",
                        {
                            actions: [
                                sap.m.MessageBox.Action.OK,
                                sap.m.MessageBox.Action.CANCEL
                            ],
                            emphasizedAction: sap.m.MessageBox.Action.OK,

                            onClose: function () {

                                // 🔄 ALWAYS refresh main table
                                oOData.refresh();

                                // 🔄 ALWAYS reset wizard (OK or CANCEL)
                                const oWizard = this.byId("registrationWizard");
                                const oModel = oView.getModel("wizard");

                                this.getView().setBindingContext(null);

                                oModel.setData({
                                    student: { firstName: "", lastName: "", dob: "", gender: "", grade: "" },
                                    parent: { fatherName: "", motherName: "", mobile: "", address: "" },
                                    fees: { feeType: "", amount: "", paymentStatus: "", receipts: [] },
                                    showStep2: false,
                                    showStep3: false,
                                    showPreview: false,
                                    showSubmit: false
                                });

                                oWizard.discardProgress(this.byId("studentStep"));
                                oWizard.goToStep(this.byId("studentStep"));
                            }.bind(this)
                        }
                    );

                    return;
                }



                /* =========================
                   CASE 2️⃣ : NO DRAFT
                   ========================= */
                await this.onSaveDraft(true); // create + bind draft

                oCtx = oView.getBindingContext();

                await oCtx.getModel()
                    .bindContext(oCtx.getPath() + "/My.draftActivate(...)")
                    .execute();

                sap.m.MessageBox.success("Registration submitted successfully", {
                    onClose: () => {
                        oOData.refresh();
                        this._resetWizard();
                    }

                });


                /* ================= RESET AFTER SUBMIT ================= */
                const oWizard = this.byId("registrationWizard");
                const oModel = oView.getModel("wizard");

                this.getView().setBindingContext(null);

                oModel.setData({
                    student: { firstName: "", lastName: "", dob: "", gender: "", grade: "" },
                    parent: { fatherName: "", motherName: "", mobile: "", address: "" },
                    fees: { feeType: "", amount: "", paymentStatus: "", receipts: [] },
                    showStep2: false,
                    showStep3: false,
                    showPreview: false,
                    showSubmit: false
                });

                oWizard.discardProgress(this.byId("studentStep"));
                oWizard.goToStep(this.byId("studentStep"));

            } catch (e) {
                console.error(e);
                sap.m.MessageBox.error(e.message || "Submit failed");
            }
        }

    });
});


