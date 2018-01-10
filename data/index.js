const productPaths = {
  betsson: {
    en: {
      ca: 'casino',
      sb: 'sportsbook',
      lca: 'livecasino'
    }
  },
  nordicbet: {
    en: {
      ca: 'casino',
      sb: 'odds',
      lca: 'livecasino'
    },
    fi: {
      ca: 'casino',
      sb: 'vedonlyönti',
      lca: 'livecasino'
    },
    da: {
      ca: 'casino',
      sb: 'sports',
      lca: 'casino\/livecasino'
    }
  },
  betsafe: {
    en: {
      ca: 'casino',
      sb: 'odds',
      lca: 'live-casino'
    }
  },
  obg: {
    en: {
      ca: 'casino',
      sb: 'sportsbook',
      lca: 'live-casino'
    },
    sv: {
      sb: 'odds',
    },
    no: {
      sb: 'odds',
    },
    fi: {
      sb: 'vedonlyonti',
    },
    is: {
      sb: 'ithrottabok'
    }
  },
  nbdkmob: {
    da: {
      ca: 'casino',
      sb: 'sportsbook',
      lca: 'casino'
    }
  }
}

const getProductPaths = settings => {
  let productPathDesk, productPathMob;
  if (settings.brand === 'nordicbet' && settings.language.match(/(fi|da)/)) {
    productPathDesk = productPaths[settings.brand][settings.language][settings.product];
  }
  else if (settings.brand === 'nordicbet') {
    productPathDesk = productPaths[settings.brand].en[settings.product];
  }
  else if (settings.brand === 'betsson' || settings.brand === 'betsafe') {
    productPathDesk = productPaths[settings.brand].en[settings.product];
  }
  if (settings.brand === 'nordicbet' && settings.language === 'da') {
    productPathMob = productPaths.nbdkmob.da[settings.product];
  }
  else {
    productPathMob = productPaths.obg[settings.language][settings.product] ?
    productPaths.obg[settings.language][settings.product] :
    productPaths.obg.en[settings.product];
  }
  return {desk: productPathDesk, mob: productPathMob}
}

const getRegExps = settings => {
  const regExps = {};
  const productPaths = getProductPaths(settings);
  if (settings.brand === 'nordicbet' && settings.topdomain === '.com') {
    regExps.desk = new RegExp(`(https:\/\/www\.nordicbet\.com)` +
                             `\/(${settings.language})` +
                             `\/(${productPaths.desk})(?:\/)?` +
                             `(\\?action=join\&campaign=${settings.optInCode}(?=\&|$))`);
  }
  if (settings.brand === 'nordicbet' && settings.topdomain === '.dk') {
    regExps.desk = new RegExp(`(https:\/\/www\.nordicbet\.dk)` +
                             `(\/da)?` +
                             `\/(${productPaths.desk})(?:\/)?` +
                             `(\\?action=join\&campaign=${settings.optInCode}(?=\&|$))`);
  }
  else if (settings.brand === 'betsson') {
    regExps.desk = new RegExp(`(https:\/\/${productPaths.desk}\.betsson\.com)` +
                              `\/(${settings.language})(?:\/)?` +
                              `(\\?action=join\&campaign=${settings.optInCode}(?=\&|$))`);
  }
  if (settings.brand === 'nordicbet' && settings.topdomain === '.dk') {
    regExps.mob = new RegExp(`(https:\/\/m\.nordicbet\.dk)` +
                             `\/(${settings.language})` +
                             `\/(${productPaths.mob})(?:\/)?` +
                             `(\\?modalroute=join-campaign/${settings.optInCode}(?=\&|$))`);
  }
  else {
    regExps.mob = new RegExp(`(https:\/\/m\.${settings.brand}\.com)` +
                             `\/(${settings.language})` +
                             `\/(${productPaths.mob})(?:\/)?` +
                             `(\\?campaign=${settings.optInCode}(?=\&|$))`);
  }

  return regExps
}

const getBrandUrls = settings => {
  const brandExact = settings.topdomain === '.dk' ?
    settings.brand + 'dk' : settings.brand;
  const temp = {};
  const brand = brandData[brandExact];
  temp.webUrl = brand[settings.language][settings.product].web;
  temp.mobUrl = brand[settings.language][settings.product].mob;
  return temp
}

module.exports = {
  getBrandUrls,
  getRegExps
}
