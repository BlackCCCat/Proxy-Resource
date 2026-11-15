// Surge response script compatible with the BoxJs keys used by kokoryh's
// Bilibili suit customization. Keep this self-contained for remote modules.
function notify(message) {
  if (typeof $notification !== "undefined") {
    $notification.post("B站装扮DIY", "", message);
  }
}

function selectedIndex(raw, type) {
  const value = String(raw || "").trim();
  if (!value) return 1;
  if (/^\d+$/.test(value)) return Number(value);

  const segments = value.split(/[;；]/);
  const selected = segments[type + 1];
  if (segments.length >= 3 && selected) {
    const match = selected.match(/^(\d+)(?::\d+)?$/);
    if (match) return Number(match[1]);
  }
  notify("参数格式非法，请检查 BoxJs 设置");
  return 1;
}

function setEquip(data, stored, number, type, key) {
  if (!stored) return;
  const equips = JSON.parse(stored);
  if (!Array.isArray(equips) || !equips.length) return;
  const index = selectedIndex(number, type);
  if (index === 0) return;
  if (index > equips.length) {
    notify("参数设置过大，请检查 BoxJs 设置");
  }
  data[key] = equips.length === 1 || index > equips.length ? equips[0] : equips[index - 1];
}

try {
  if (typeof $response.body !== "string" || !$response.body) {
    $done({});
  } else {
    const result = JSON.parse($response.body);
    if (!result || !result.data || typeof result.data !== "object") {
      $done({});
    } else {
      delete result.data.common_equip;
      const type = result.data.skin_colors ? 0 : 1;
      const read = key => $persistentStore.read(key);
      setEquip(result.data, read("bili_user_equip"), read("bili_skin_num"), type, "user_equip");
      setEquip(result.data, read("bili_load_equip"), read("bili_load_num"), type, "load_equip");
      $done({ body: JSON.stringify(result) });
    }
  }
} catch (error) {
  console.log(`[B站装扮DIY] ${error}`);
  $done({});
}
