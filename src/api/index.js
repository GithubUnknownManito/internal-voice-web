import request, {upload} from "@/utils/request.js";

export function register(payload) {
  return request.post("/module/anonymous/register", payload);
}
export function devastate(payload) {
  return request.post("/module/anonymous/devastate", payload);
}
export function anonymousList(payload) {
  return request.post("/module/anonymous/list", payload);
}
export function roomList() {
  return request.post("/module/room/list", {});
}

export function uploadImage(file, strategy_id){
  return upload(file,strategy_id)
}
