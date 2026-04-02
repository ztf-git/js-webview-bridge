package com.ztf.android_demo.activity;

import android.annotation.SuppressLint;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebViewClient;
import android.widget.Button;

import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.github.lzyzsd.jsbridge.BridgeHandler;
import com.github.lzyzsd.jsbridge.BridgeWebView;
import com.github.lzyzsd.jsbridge.BridgeWebViewClient;
import com.github.lzyzsd.jsbridge.CallBackFunction;
import com.github.lzyzsd.jsbridge.DefaultHandler;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.ztf.android_demo.R;
import com.ztf.android_demo.base.BaseActivity;
import com.ztf.android_demo.bridge.BridgeEvent;
import com.ztf.android_demo.bridge.RxBridge;


public class MainActivity extends BaseActivity {
    private final String TAG = "MainActivity";
    private BridgeWebView webView;
    @SuppressLint("CheckResult")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
        webView = findViewById(R.id.webview);
        handleBackPressed();
        onLoadWebview();
        setOnClickListener();
        RxBridge.events("notice")
                .subscribe(event -> {
                    Log.w(TAG, "收到 notice 事件"+event.toString());
                    // 处理逻辑
                });
    }
    // 加载webview
    private void onLoadWebview() {
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true); // 启用DOM存储
        webSettings.setDatabaseEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false); // 允许自动播放
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        // 开启http/https混合模式
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        webView.setWebViewClient(new BridgeWebViewClient(webView));
        webView.setWebChromeClient(new WebChromeClient());
        webView.setDefaultHandler(new DefaultHandler());
        webView.clearCache(true);
        webView.clearFormData();
        webView.clearHistory();
        webView.requestFocusFromTouch();// 支持获取手势焦点，输入用户名、密码或其他
        webView.loadUrl("http://192.168.11.111:5173");
        registerHandler();
    }
    // 注册安卓方法给js调用
    private void registerHandler() {
        webView.registerHandler("handleAndroid", new BridgeHandler() {
            @Override
            public void handler(String data, CallBackFunction function) {
                Log.w(TAG, "handler = handleAndroid, data from web = " + data);
                JsonObject jsonObject = new JsonObject();
                jsonObject.add("message", JsonParser.parseString("{data:[], name: test}").getAsJsonObject());
                jsonObject.addProperty("code", 200);
                function.onCallBack(new Gson().toJson(jsonObject));
            }
        });
        webView.registerHandler("BridgeEvent", new BridgeHandler() {
            @Override
            public void handler(String data, CallBackFunction function) {
                Log.w(TAG, "收到web端发送的BridgeEvent事件参数=" + data);
                try{
                    BridgeEvent event = new Gson().fromJson(data, BridgeEvent.class);
                    // 推入 Rx 流
                    RxBridge.emit(event);
                    function.onCallBack("success");
                } catch (Exception e) {
                    function.onCallBack("error");
                    e.printStackTrace();
                }
            }
        });
    }
    // 给web端发消息
    public void sendToWeb() {
        JsonObject jsonObject = new JsonObject();
        jsonObject.addProperty("id", "1");
        jsonObject.addProperty("name", "test");
        Log.w(TAG, "handler = testH5");
        webView.callHandler("testH5", new Gson().toJson(jsonObject), new CallBackFunction() {
            @Override
            public void onCallBack(String data) {
                Log.w(TAG, "handler = testH5, data from web = " + data);
            }
        });
    }
    // 发送event事件
    public void sendEvent() {
        BridgeEvent bridgeEvent = new BridgeEvent("test", "notice");
        JsonObject jsonObject = new JsonObject();
        jsonObject.addProperty("name", "你好web我是native");
        bridgeEvent.setParams(jsonObject);
        Log.w(TAG, "sendEvent ========");
        webView.callHandler("BridgeEvent", new Gson().toJson(bridgeEvent), new CallBackFunction() {
            @Override
            public void onCallBack(String data) {
                Log.w(TAG, "handler = BridgeEventH5, data from web = " + data);
            }
        });
    }
    @Override
    public void handleBackPressed() {
        OnBackPressedCallback callback = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false); // 关闭拦截
                    getOnBackPressedDispatcher().onBackPressed(); // 继续系统返回
                }
            }
        };
        getOnBackPressedDispatcher().addCallback(this,callback);
    }

    public void setOnClickListener() {
        findViewById(R.id.test_button).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendToWeb();
            }
        });
        findViewById(R.id.refresh_button).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                webView.reload();
            }
        });findViewById(R.id.event_button).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendEvent();
            }
        });
    }
}