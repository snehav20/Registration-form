sap.ui.define([
    "sap/ui/core/UIComponent",
    "registration/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("registration.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);
            jQuery.sap.includeStyleSheet(
                sap.ui.require.toUrl("registration/css/style.css")
            );

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        }
    });
});