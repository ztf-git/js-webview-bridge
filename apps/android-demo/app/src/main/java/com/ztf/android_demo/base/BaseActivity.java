package com.ztf.android_demo.base;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

public class BaseActivity extends AppCompatActivity {
    public void handleBackPressed() {
        OnBackPressedCallback callback = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
//                finish();
                getOnBackPressedDispatcher().onBackPressed(); // 继续系统返回
            }
        };
        getOnBackPressedDispatcher().addCallback(this,callback);
    }
}
