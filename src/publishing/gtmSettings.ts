export interface GoogleTagManagerSettings {
    /**
     * GTM container ID, e.g. GTM-000000.
     */
    containerId?: string;

    /**
     * Web-specific GTM container ID, e.g. GTM-000000.
     */
    webContainerId?: string;

    /**
     * AMP-specific GTM container ID, e.g. GTM-000000.
     */
    ampContainerId?: string;

    /**
     * GTM data layer name.
     */
    dataLayerName?: string;
}