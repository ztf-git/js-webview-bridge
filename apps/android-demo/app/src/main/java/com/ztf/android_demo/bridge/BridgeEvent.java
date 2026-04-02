package com.ztf.android_demo.bridge;

import com.google.gson.JsonObject;

public class BridgeEvent {
    public String id;           // 请求唯一ID
    public String type;         // 事件名 (test)
    public String source;       // web / native
    public JsonObject data;       // 事件数据
    public long timestamp;

    public BridgeEvent(String id, String type) {
        this.id = id;
        this.type = type;
    }

    public BridgeEvent setParams(JsonObject data) {
        this.source = "native";
        this.timestamp = System.currentTimeMillis();
        this.data = data;
        return this;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public JsonObject getData() {
        return data;
    }

    public void setData(JsonObject data) {
        this.data = data;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "BridgeEvent{" +
                "id='" + id + '\'' +
                ", type='" + type + '\'' +
                ", source='" + source + '\'' +
                ", data=" + data +
                ", timestamp=" + timestamp +
                '}';
    }
}
