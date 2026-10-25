/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const APP_VERSION = 'v4.8 PRO Ultimate';

export interface DebloatPackageItem {
  pkg: string;
  reason: string;
  level: 1 | 2 | 3;
  desc: string;
}

export interface HonorTurboRamStatus {
  swapSize: string;
  phantomLimit: string;
  maxCachedProcesses: string;
  activeMessagingAppsCount: number;
  isOptimized: boolean;
}

const PACKAGE_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/;

/**
 * Làm sạch chuỗi tên gói ứng dụng (Package Name) do người dùng nhập vào,
 * loại bỏ hoàn toàn các ký tự nguy hiểm (; | & $ ` " ' \n) để chống Command Injection qua ADB Shell.
 */
export function sanitizePackageName(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9._]/g, '');
  return PACKAGE_NAME_REGEX.test(cleaned) ? cleaned : '';
}

export function isValidPackageName(raw: string): boolean {
  return PACKAGE_NAME_REGEX.test(raw.trim());
}

/**
 * Danh sách các ứng dụng nhắn tin & liên lạc quan trọng cần ưu tiên giữ đa nhiệm (Active Bucket + DeviceIdle Whitelist)
 */
export const CORE_MESSAGING_APPS: readonly string[] = [
  'com.zing.zalo',
  'com.facebook.orca',
  'com.facebook.katana',
  'org.telegram.messenger',
  'org.thunderdog.challegram',
  'com.google.android.gm',
  'com.whatsapp',
  'com.viber.voip',
  'com.tencent.mm',
  'jp.naver.line.android',
  'com.skype.raider',
  'com.discord'
];

/**
 * Danh sách hệ sinh thái ứng dụng hỗ trợ Shizuku
 */
export const SHIZUKU_ECOSYSTEM_APPS: readonly string[] = [
  'moe.shizuku.privileged.api',
  'io.github.samolego.canta',
  'com.aistra.hail',
  'rikka.appops',
  'eu.thedarken.sdm',
  'in.sunilpaulmathew.ashell',
  'com.catchingnow.icebox',
  'dev.zwander.installwithoptions',
  'com.kieronquinn.app.darq',
  'com.zacharee1.systemuituner',
  'com.arlosoft.macrodroid',
  'by4a.setedit22'
];

/**
 * Danh sách các package hệ thống cực kỳ quan trọng, tuyệt đối không được xóa
 */
export const CRITICAL_PACKAGES: readonly string[] = [
  'android',
  'com.android.systemui',
  'com.android.settings',
  'com.android.phone',
  'com.android.server.telecom',
  'com.android.providers.telephony',
  'com.google.android.gms',
  'com.android.vending',
  'com.hihonor.android.launcher',
  'com.hihonor.systemmanager',
  'com.hihonor.cloud',
  'com.hihonor.parallelspace',
  'com.huawei.parallelspace'
];

/**
 * Danh sách các package hệ thống được phân loại theo cấp độ (Ưu tiên Cấp 1 an toàn tuyệt đối lên đầu)
 */
export const DEBLOAT_WHITELIST: readonly DebloatPackageItem[] = [
  {
    pkg: 'com.hihonor.powergenius',
    reason: 'AI quản lý pin (PowerGenius)',
    level: 1,
    desc: 'Giết app ngầm cực đoan gây mất thông báo. Gỡ bỏ là ưu tiên số 1 để fix Facebook/Zalo.'
  },
  {
    pkg: 'com.hihonor.iaware',
    reason: 'AI phân tích hành vi (iAware)',
    level: 1,
    desc: 'Hỗ trợ PowerGenius đóng ứng dụng. Vô hiệu hóa giúp máy chạy đúng ý người dùng hơn.'
  },
  {
    pkg: 'com.huawei.powergenie',
    reason: 'Legacy Power Management',
    level: 1,
    desc: 'Trình quản lý pin đời cũ của Huawei còn sót lại trên MagicOS gây trễ thông báo.'
  },
  {
    pkg: 'com.hihonor.video',
    reason: 'Honor Video',
    level: 1,
    desc: 'Trình phát video mặc định, thường xuyên hiện quảng cáo và đề xuất nội dung Trung Quốc.'
  },
  {
    pkg: 'com.hihonor.gamecenter',
    reason: 'Trung tâm trò chơi Honor',
    level: 1,
    desc: 'Gây phiền nhiễu với các thông báo đẩy về game nội địa Trung Quốc.'
  },
  {
    pkg: 'com.hihonor.search',
    reason: 'Honor Search (Vuốt xuống tìm kiếm)',
    level: 1,
    desc: 'Gây lag khi vuốt màn hình chính. Nên tắt hoặc gỡ bỏ để thao tác vuốt mượt mà hơn.'
  },
  {
    pkg: 'com.hihonor.browser',
    reason: 'Trình duyệt Honor',
    level: 1,
    desc: 'Trình duyệt mặc định nhiều nội dung tiếng Trung. Thay thế bằng Chrome/Edge an toàn.'
  },
  {
    pkg: 'com.hihonor.magazinesettings',
    reason: 'Màn hình khóa tạp chí',
    level: 1,
    desc: 'Tự động tải ảnh nền gây tốn dữ liệu di động và tiêu hao pin ngầm.'
  },
  {
    pkg: 'com.hihonor.music',
    reason: 'Honor Music (Nhạc nội địa TQ)',
    level: 1,
    desc: 'Ứng dụng nghe nhạc bản quyền nội địa Trung, nên thay thế bằng Spotify / YouTube Music.'
  },
  {
    pkg: 'com.hihonor.reader',
    reason: 'Honor Reader (Sách & Truyện TQ)',
    level: 1,
    desc: 'Ứng dụng đọc truyện nội địa tiếng Trung, hoàn toàn không có tác dụng tại Việt Nam.'
  },
  {
    pkg: 'com.hihonor.mall',
    reason: 'Honor Mall (Sàn mua sắm TQ)',
    level: 1,
    desc: 'Gian hàng mua sắm phần cứng Honor tại Trung Quốc, gỡ bỏ an toàn tuyệt đối.'
  },
  {
    pkg: 'com.hihonor.live',
    reason: 'Honor Live (Livestream TQ)',
    level: 1,
    desc: 'Kênh phát trực tiếp video nội địa, chạy ngầm tiêu tốn băng thông.'
  },
  {
    pkg: 'com.hihonor.servicecenter',
    reason: 'Honor Service (Dịch vụ hỗ trợ TQ)',
    level: 1,
    desc: 'Trung tâm hỗ trợ khách hàng nội địa Trung Quốc, không hữu dụng tại Việt Nam.'
  },
  {
    pkg: 'com.hihonor.hiboard',
    reason: 'Honor HiBoard (Bảng tin vuốt trái)',
    level: 1,
    desc: 'Bảng tin tức tiếng Trung khi vuốt sang trái màn hình chính, gây giật lag launcher.'
  },
  {
    pkg: 'com.hihonor.quickclip',
    reason: 'Honor QuickClip (Dựng clip ngắn)',
    level: 1,
    desc: 'Công cụ dựng clip tự động, ít sử dụng và tốn dung lượng bộ nhớ.'
  },
  {
    pkg: 'com.hihonor.appmarket',
    reason: 'Honor App Market',
    level: 2,
    desc: 'Chợ ứng dụng Honor. Cân nhắc: Gỡ bỏ an toàn nếu bạn chỉ dùng Google Play Store.'
  },
  {
    pkg: 'com.hihonor.assistant',
    reason: 'Honor Assistant (Trợ lý ảo YOYO)',
    level: 2,
    desc: 'Trợ lý ảo YOYO tiếng Trung. Có thể gỡ bỏ an toàn nếu dùng Google Assistant hoặc Gemini.'
  },
  {
    pkg: 'com.hihonor.vassistant',
    reason: 'Honor YOYO Voice Assistant (Trợ lý giọng nói YOYO)',
    level: 2,
    desc: 'Trợ lý giọng nói YOYO tiếng Trung mặc định trên máy nội địa.'
  },
  {
    pkg: 'com.hihonor.yoyo',
    reason: 'Honor YOYO Core (Nhân trợ lý YOYO)',
    level: 2,
    desc: 'Ứng dụng lõi của trợ lý YOYO nội địa Trung Quốc.'
  },
  {
    pkg: 'com.hihonor.magicvoice',
    reason: 'Honor MagicVoice (Đánh thức giọng nói YOYO)',
    level: 2,
    desc: 'Dịch vụ nhận diện giọng nói gọi YOYO của Honor.'
  },
  {
    pkg: 'com.hihonor.wallet',
    reason: 'Honor Wallet (Ví thanh toán TQ)',
    level: 2,
    desc: 'Ví điện tử nội địa Trung Quốc. Cân nhắc: Nếu không dùng thẻ giao thông / NFC TQ thì có thể gỡ.'
  },
  {
    pkg: 'com.hihonor.health',
    reason: 'Honor Health (Sức khỏe TQ)',
    level: 2,
    desc: 'App theo dõi sức khỏe nội địa. Cân nhắc: Nếu đang kết nối vòng đeo tay Honor Band/Watch thì giữ lại.'
  },
  {
    pkg: 'com.hihonor.cloud',
    reason: 'Honor Cloud (Đám mây Honor)',
    level: 2,
    desc: 'Dịch vụ lưu trữ đám mây của Honor. Nếu không dùng tài khoản Honor thì có thể gỡ.'
  },
  {
    pkg: 'com.hihonor.android.clone',
    reason: 'Honor Device Clone',
    level: 2,
    desc: 'Công cụ chuyển vùng dữ liệu. Chỉ dùng khi mới mua máy, gỡ sau đó để nhẹ máy.'
  },
  {
    pkg: 'com.hihonor.fans',
    reason: 'Honor Fans (Cộng đồng Honor)',
    level: 1,
    desc: 'Mạng xã hội dành cho fan Honor tại Trung Quốc, gỡ bỏ an toàn.'
  },
  {
    pkg: 'com.hihonor.systemmanager',
    reason: 'Trình quản lý hệ thống Honor',
    level: 3,
    desc: 'QUAN TRỌNG: Quản lý dọn dẹp, quét virus. Không nên gỡ nếu không rành.'
  },
  {
    pkg: 'com.hihonor.phone.recorder',
    reason: 'Ghi âm cuộc gọi Honor',
    level: 2,
    desc: 'Tính năng ghi âm cuộc gọi mặc định. Nếu dùng app bên thứ 3 thì có thể gỡ.'
  },
  {
    pkg: 'com.hihonor.vmall',
    reason: 'Honor VMall',
    level: 1,
    desc: 'Cửa hàng trực tuyến của Honor tại Trung Quốc, gỡ bỏ an toàn.'
  },
  {
    pkg: 'com.hihonor.findmydevice',
    reason: 'Tìm điện thoại Honor',
    level: 2,
    desc: 'Dịch vụ tìm máy thất lạc của Honor. Nên giữ lại nếu bạn dùng tài khoản Honor.'
  },
  {
    pkg: 'com.hihonor.smartsuggestion',
    reason: 'Gợi ý thông minh YOYO',
    level: 2,
    desc: 'Các gợi ý dựa trên thói quen của YOYO. Gỡ sẽ làm launcher đơn giản hơn.'
  }
];
