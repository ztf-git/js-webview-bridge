package com.ztf.android_demo.bridge;

import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.subjects.PublishSubject;

public class RxBridge {
    private static final PublishSubject<BridgeEvent> subject = PublishSubject.create();

    // 对外暴露事件流
    public static Observable<BridgeEvent> events() {
        return subject.hide();
    }
    // 对外暴露指定类型的事件流
    public static Observable<BridgeEvent> events(String type) {
        return subject.filter(e -> type.equals(e.type));
    }

    // 推送事件
    public static void emit(BridgeEvent event) {
        subject.onNext(event);
    }
}
