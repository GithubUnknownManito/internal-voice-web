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
    </div>
    <div class="grid-room-content">
      <div></div>
    </div>
    <el-button circle class="config" @click="dialogUserConfigVisible = true">
      <el-icon>
        <Tools />
      </el-icon>
    </el-button>
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
        userInfo: {
          id: "",
          name: "大笨猫",
          avatar: '',
          roomId: ''
        },
        activeName: "",
        roomList: [],
        userList: [],
        dialogUserConfigVisible: false,
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
    methods: {
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
        var chatSocket = ChatRoomSocket({
          room: this.activeName,
          grid: this.userInfo.id
        })
        chatSocket.addEventListener("message-join", () => {
          // eslint-disable-next-line no-debugger
          debugger
          this.getRoomUser()
          this.getRoomList()
        })
      },
      getRoomList() {
        roomList().then((res) => {
          console.log(res)
          this.roomList = res.data
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
  }

  .grid-room-content {
    width: 100%;
    height: 100%;
    display: inline-grid;
    grid-template-columns: 100%;
    grid-template-rows: 60px calc(100% - 60px);
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
</style>