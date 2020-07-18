export const str = (text: string | null) => (text ? String(text) : '');

export const zeroPadding = (num: number, len: number) => {
  return String(num).padStart(len, '0');
};

export const hiraToKana = (str: string) => {
  return str.replace(/[\u3041-\u3096]/g, function (match: string) {
    var chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
};

export const toInternationalPhoneNumber = (phoneNumber: string) => {
  let phone = phoneNumber.replace(/[-\s]/g, '');
  if (phone.length > 0 && phone[0] === '0') phone = phone.substring(1);
  return '+81' + phone;
};
