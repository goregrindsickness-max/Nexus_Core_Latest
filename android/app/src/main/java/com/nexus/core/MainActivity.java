package com.nexus.core;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure CookieManager to accept third-party cookies for embedded players like Bandcamp
        try {
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            if (this.bridge != null && this.bridge.getWebView() != null) {
                cookieManager.setAcceptThirdPartyCookies(this.bridge.getWebView(), true);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Configure WebView settings to enable DOM Storage, JavaScript, File access and Content access
        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                WebView webView = this.bridge.getWebView();
                WebSettings settings = webView.getSettings();
                if (settings != null) {
                    settings.setDomStorageEnabled(true);
                    settings.setJavaScriptEnabled(true);
                    settings.setAllowFileAccess(true);
                    settings.setAllowContentAccess(true);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
