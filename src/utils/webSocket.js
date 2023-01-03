import { ElMessage } from "element-plus";

var STOChatRoomSocket;

class ChatRoomSocketFunction extends EventTarget {
  baseUrl = process.env.VUE_APP_BASE_Socket;
  option = null;
  webSocket = null;
  statusType = 0;
  voiceStatus = 0;
  voiceObj = null;
  constructor(option) {
    super();
    this.option = option;
    this.webSocket = new WebSocket(this.url);
    this.webSocket.addEventListener("open", () => {
      this.heartBeat();
    });
    this.webSocket.addEventListener("message", (event) => {
      const { status, data } = JSON.parse(event.data);
      const { from, model, content } = data || {
        from: "",
        model: "",
        content: "",
      };
      var message = null;
      if (status == 100) {
        message = new CustomEvent("message-join");
      } else if (status == 150) {
        message = new CustomEvent("message-left");
      } else if (status == 200) {
        setTimeout(() => {
          this.heartBeat();
        }, 6000);
        return;
      } else if (status == 300) {
        message = new CustomEvent("message", { detail: data });
      } else if (status == 400) {
        if (model == "PEOPLE") {
          this.statusType = 1;
          this.voiceStatus = 1;
          this.voiceObj = from;
          message = new CustomEvent("voice-invitation", {
            detail: {
              from: from,
              model: model,
            },
          });
        } else {
          this.statusType = 2;
          this.voiceStatus = 2;
          return;
        }
      } else if (status == 411) {
        this.voiceStatus = 2;
        message = new CustomEvent("voice-accept", {
          detail: {
            from: from,
            model: model,
          },
        });
      } else if (status == 412) {
        this.voiceStatus = 0;
        this.voiceObj = null;
        message = new CustomEvent("voice-reject", {
          detail: {
            from: from,
            model: model,
          },
        });
      } else if (status == 490) {
        this.voiceStatus = 0;
        this.statusType = 0;
        this.voiceObj = null;
        message = new CustomEvent("voice-end", {
          detail: {
            from: from,
            model: model,
          },
        });
      } else if (status == 500) {
        console.log("d", data);
      } else if (status == 900) {
        message = new CustomEvent("private-message", { detail: data });
      } else if (status == 1005) {
        ElMessage.error(content);
      }
      message && this.dispatchEvent(message);
    });
    this.webSocket.addEventListener("error", (event) => {
      console.error("error", event);
    });
    this.webSocket.addEventListener("close", () => {
      this.close();
    });

    window.addEventListener("beforeunload", this.beforeunload);
  }

  get url() {
    var keys = Object.keys(this.option);
    var url = this.baseUrl;
    keys.forEach((key) => {
      url = url.replace(`{${key}}`, this.option[key]);
    });
    return url;
  }

  get user() {
    return this.option.grid;
  }

  get room() {
    return this.option.room;
  }

  heartBeat() {
    this.send({
      code: 200,
      model: "PEOLE",
      to: "",
      form: "",
      msg: "心跳请求",
    });
  }

  text(to, msg, type = "PEOLE") {
    this.send({
      code: 300,
      model: type,
      to: to,
      form: this.option.grid,
      msg: msg,
    });
  }

  command(code, model, to, msg = "") {
    this.send({
      code: code,
      model: model,
      to: to,
      form: this.user,
      msg: msg,
    });
  }

  commandVoice() {
    const that = this;
    return {
      invitation(to) {
        that.voiceStatus = 1;
        this.command(400, "PEOLE", to);
      },
      accept() {
        that.voiceStatus = 2;
        this.command(401, "PEOLE", this.privateUserId);
      },
      reject() {
        that.voiceStatus = 0;
      },
    };
  }

  commandRoom() {
    const that = this;
    return {
      invitation(to, type = "PEOLE") {
        that.voiceStatus = 1;
        that.send({
          code: 400,
          model: type,
          to: to,
          form: that.option.grid,
          msg: "",
        });
      },
    };
  }

  send(data) {
    if (!data) {
      return;
    }
    if (data instanceof String) {
      data = JSON.parse(data);
    }
    var stamp = new Date().getTime();
    this.webSocket.send(
      JSON.stringify({
        ...data,
        stamp,
      })
    );
    return stamp;
  }

  beforeunload() {
    this.close();
  }

  close() {
    this.webSocket.close();
    window.removeEventListener("beforeunload", this.beforeunload);
  }
}

export function ChatRoomSocket(option) {
  try {
    if (STOChatRoomSocket) {
      STOChatRoomSocket.close;
    }
    return (STOChatRoomSocket = new ChatRoomSocketFunction(option));
  } finally {
    console.log("STOChatRoomSocket", STOChatRoomSocket);
  }
}
