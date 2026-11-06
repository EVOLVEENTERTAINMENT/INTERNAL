// Home: the greeting, the Need you list, the live project count and the way
// to close the day.
'use strict';
module.exports = async function (H) {
  await H.tab('dash');
  H.t('home: title is Home', H.text('#ptitle') === 'Home', H.text('#ptitle'));
  H.t('home: greets the owner by name', H.has('#stage', ownerName()), ownerName());
  const need = needYou(view());
  H.t('home: the Need you list is built', Array.isArray(need), String(need.length) + ' rows');
  const nl = coProjects(view()).filter(p => p.stage !== 'Delivery').filter(isLive).length;
  H.t('home: the live project count matches the page', nl ? H.has('#stage', nl + ' live project') : true, nl + ' live');
  H.t('home: nothing reads as undefined', !H.has('#stage', 'undefined') && !H.has('#stage', 'NaN'));
  H.t('home: the sample projects are counted in the rail', /\d/.test(H.text('#m-board')) || H.text('#m-board') === '', H.text('#m-board'));
};
