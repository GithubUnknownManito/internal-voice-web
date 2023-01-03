<template>
  <div class="grid">
    <div class="grid-room-tree">
      <el-collapse v-model="activeName" accordion>
        <el-collapse-item v-for="room in roomList" :key="room.id" :title="room.name" :name="room.id" :disabled="!room.enable">
          <template #title>
            <el-badge v-if="room.enable" :value="room.onlineNumber" class="badge-item">
              <span>{{room.name}}</span>
            </el-badge>
            <span v-else>{{room.name}}</span>
          </template>
          <div class="user-itme" v-for="user in userList" :key="user.id">
            <el-avatar shape="square" :src="user.avatar" />
            <el-dropdown>
              <span class="el-dropdown-link">
                <span>{{user.name}}</span>
                <el-icon class="el-icon--right">
                  <arrow-down />
                </el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>拉去私聊</el-dropdown-item>
                  <el-dropdown-item>打电话给ta</el-dropdown-item>
                  <el-dropdown-item divided disabled>
                    <el-tooltip class="box-item" effect="dark" content="还在开发，文件上传后开通的功能" placement="right">
                      <span>语戳一下</span>
                    </el-tooltip>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-collapse-item>
      </el-collapse>
      <el-button circle class="config" @click="dialogUserConfigVisible = true">
        <el-icon>
          <Tools />
        </el-icon>
      </el-button>
    </div>
    <div class="grid-room-content">
      <div class="grid-room-content--title">
        <span>{{currentRoom && currentRoom.name}}</span>
      </div>
      <div class="grid-room-content--message">
        <div ref="message-body" class="message-body">
          <ul ref="message-item" class="grid-room-content--message-body">
            <template v-for="(msg,index) in currentRoom.msg" :key="index">
              <li v-if="msg.isMe" class="message-body-bubble bubble-send">
                <div class="message-body-bubble--avatar">
                  <el-avatar shape="square" :src="msg.avatar" />
                </div>
                <div class="message-body-bubble--msg">
                  <div class="message-body-bubble--content">
                    <span class="bubble-text" v-html="msg.text"></span>
                  </div>
                </div>
              </li>
              <li v-else class="message-body-bubble">
                <div class="message-body-bubble--avatar">
                  <el-avatar shape="square" :src="msg.avatar" />
                </div>
                <div class="message-body-bubble--msg">
                  <div class="message-body-bubble--name">
                    <span class="bubble-text">{{msg.userName}}</span>
                  </div>
                  <div class="message-body-bubble--content">
                    <span class="bubble-text" v-html="msg.text"></span>
                  </div>
                </div>
              </li>
            </template>
          </ul>
        </div>
        <div class="message-content">
          <div class="message-content--input">
            <el-input type="textarea" v-model="message" resize="none" v-on:keydown.enter="handleMessageKeyDown"></el-input>
          </div>
          <el-button class="message-content--button" type="primary" @click="handleSend">发送</el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogUserConfigVisible" title="我的昵称设置" width="500px">
      <el-form :model="userInfo" label-width="120px">
        <el-form-item label="你的名称">
          <el-input v-model="userInfo.name" />
        </el-form-item>
        <el-form-item label="头像">
          <el-upload class="avatar-uploader" action="" :show-file-list="false" :http-request="httpRequest" :on-success="handleAvatarSuccess" :before-upload="beforeAvatarUpload">
            <img v-if="userInfo.avatar" :src="userInfo.avatar" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon">
              <Plus />
            </el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <div style="text-align: right;">
        <el-button type="primary" plain @click="registerUser">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  import {
    register,
    devastate,
    anonymousList,
    roomList,
    uploadImage
  } from '@/api/index.js'
  import {
    ElMessage
  } from 'element-plus'
  import {
    ChatRoomSocket
  } from '@/utils/webSocket.js'
  export default {
    name: 'App',
    data() {
      return {
        dialogUserConfigVisible: false,
        userInfo: {
          id: "",
          name: "大笨猫",
          avatar: '',
          roomId: ''
        },
        activeName: "",
        roomList: [],
        userList: [],
        chatSocket: null,
        message: "",
      }
    },
    watch: {
      activeName() {
        this.getRoomUser()
        this.registerUser()
        this.getRoomList()
      }
    },
    created() {
      this.getRoomList();
      if (!this.createUser()) {
        this.registerUser();
      }
      window.onbeforeunload = () => {
        setTimeout(() => {
          this.devastate()
        })

      }
    },
    computed: {
      currentRoom() {
        return this.roomList.find(room => room.id == this.activeName)
      },
    },
    methods: {
      handleSend() {
        this.chatSocket.text(this.activeName, this.message, "ROOM")
        this.message = ""
      },
      createUser() {
        this.userInfo = JSON.parse(localStorage.getItem("__user"));
        if (!this.userInfo) {
          this.userInfo = {
            id: new Date().getTime() * (Math.round(Math.random() * 2000) % 30),
            name: this.userInfo && this.userInfo.name || "我们都是大笨猫",
            avatar: this.userInfo && this.userInfo.avatar || "",
            roomId: this.activeName
          }
          this.dialogUserConfigVisible = true
          return false
        }
        return true
      },
      registerUser() {
        var data = {
          ...this.userInfo,
          roomId: this.activeName
        }
        localStorage.setItem("__user", JSON.stringify(data))
        register(data).then(() => {
          this.dialogUserConfigVisible = false
          this.getRoomUser()
        })
        var chatSocket = this.chatSocket = ChatRoomSocket({
          room: this.activeName,
          grid: this.userInfo.id
        })
        chatSocket.addEventListener("message-join", () => {
          setTimeout(() => {
            this.getRoomUser()
          }, 1500)
        })
        chatSocket.addEventListener("message-left", () => {
          setTimeout(() => {
            this.getRoomUser()
          }, 1500)
        })
        chatSocket.addEventListener("message", (event) => {
          var {
            from,
            model,
            content
          } = event.detail
          var user = this.userList.find(e => e.id == from)
          if (model == "ROOM") {
            this.currentRoom.msg.push({
              avatar: user.avatar,
              userName: user.name,
              text: content.replace(/</g, "&gt;").replace(/>/g, "&lt;").replace(/\n/g, "<br/>"),
              isMe: user.id == this.userInfo.id
            })
          }
          this.$nextTick(() => {
            var offsetHeight = this.$refs['message-body'].offsetHeight;
            var scrollHeight = this.$refs['message-body'].scrollHeight
            var height = this.$refs['message-item'].offsetHeight;
            if (scrollHeight > offsetHeight) {
              this.$refs['message-body'].scrollTop = height
            }
          })
        })
      },
      getRoomList() {
        roomList().then((res) => {
          console.log(res)
          this.roomList = res.data.map(item => {
            return {
              ...item,
              msg: []
            }
          })
          if (!this.activeName) {
            this.activeName = this.roomList[0].id
          }
        })
      },
      getRoomUser() {
        anonymousList({
          roomId: this.activeName,
        }).then(res => {
          console.log(res)
          this.userList = res.data
        })
      },
      handleAvatarSuccess(response) {
        this.userInfo.avatar = response.data.data.links.url;
      },
      httpRequest(a) {
        return uploadImage(a.file, 1)
      },
      beforeAvatarUpload(rawFile) {
        console.log(rawFile.type)
        if (['image/png', 'image/jpg'].includes(rawFile.type)) {
          ElMessage.error('仅支持上传png，jpg图片')
          return false
        } else if (rawFile.size / 1024 / 1024 > 2) {
          ElMessage.error('最大2MB')
          return false
        }
        return true
      },
      handleMessageKeyDown(e) {
        if (e.ctrlKey && e.keyCode == 13) {
          this.message += '\n';
        } else {
          this.handleSend()
          if (e != undefined) {
            e.preventDefault();
          }
        }
      },
      devastate() {
        devastate(this.userInfo).then(res => {
          console.log('devastate', res);
        })
      }
    },
    beforeUnmount() {
      this.devastate()
    }
  }
</script>

<style scoped>
  .grid {
    display: inline-grid;
    align-content: center;
    justify-content: center;
    align-items: center;
    justify-items: start;
    width: 100%;
    height: 100vh;
    padding: 0px;
    margin: 0px;
    grid-template-columns: 20% 80%;
    grid-template-rows: 100%;
  }

  .grid-room-tree {
    width: 100%;
    height: 100%;
    border-right: 1px solid salmon;
    position: relative;
  }

  .grid-room-content {
    width: 100%;
    height: 100%;
    display: inline-grid;
    grid-template-columns: 100%;
    grid-template-rows: 60px calc(100% - 60px);
  }

  .grid-room-content--title {
    text-align: center;
    line-height: 60px;
    border-bottom: 1px solid darkgoldenrod;
  }

  .grid-room-content--message {
    width: 100%;
    height: 100%;
  }

  .grid-room-content--message-body {
    width: 100%;
  }


  .el-collapse-item:deep() .el-collapse-item__header {
    padding-left: 20px;
  }

  .badge-item:deep() .el-badge__content {
    top: 15px;
    right: 0px;
  }

  .user-itme {
    display: inline-flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-content: center;
    justify-content: flex-start;
    align-items: center;
    gap: 10px;
    width: 100%;
    border-bottom: 1px slategrey solid;
    padding: 6px 20px;
    padding-left: 40px;
  }

  .config {
    position: absolute;
    right: 40px;
    bottom: 40px;
    width: 40px;
    height: 40px;
  }

  .message-body-bubble {
    display: inline-flex;
    width: 100%;
    flex-direction: row;
    gap: 8px;
    padding: 12px 9px;
  }

  .message-body-bubble--msg {
    flex: 100%;
    width: 100%;
    display: inline-grid;
  }

  .message-body-bubble--content {
    position: relative;
    padding: 10px 8px;
    width: 32%;
    word-break: break-all;
  }

  .message-body-bubble--content span {
    position: relative;
    z-index: 1;
  }

  .message-body-bubble--content:before {
    content: "";
    position: absolute;
    width: 9px;
    height: 9px;
    top: 6px;
    left: -4px;
    background: #9f9f9fd1;
    transform: rotate(45deg);
  }

  .message-body-bubble--content:after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background: #9f9f9fd1;
    top: 0px;
    left: 0px;
    z-index: 0;
    border-radius: 7px;
  }

  .bubble-send {
    flex-direction: row-reverse;
  }

  .bubble-send .message-body-bubble--name {
    text-align: end;
  }

  .bubble-send .message-body-bubble--msg {
    justify-items: end;
  }

  .bubble-send .message-body-bubble--content:before {
    left: unset;
    right: -4px;
  }

  .message-body {
    overflow-y: auto;
    height: calc(100% - 80px);
    width: 100%;
  }

  .message-content {
    width: 100%;
    padding: 8px 9px;
    height: 80px;
    display: inline-flex;
  }

  .message-content--input {
    height: 100%;
    width: 100%
  }

  .message-content--button {
    width: 80px;
    height: 100%;
  }

  .message-content--input .el-textarea,
  .el-textarea:deep() .el-textarea__inner {
    height: 100%;
  }
</style>