export default function(url, name) {
  const link = document.createElement('a');
  link.href = url;
  link.download = 'somethingdope';

  const e = document.createEvent('MouseEvents');
  e.initEvent('click', true, true);
  link.dispatchEvent(e);
}
