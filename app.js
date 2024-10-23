const fetch = require("node-fetch");
const fsp = require("node:fs/promises");
const fs = require("node:fs");

// Willhaben links: https://www.willhaben.at/robots.txt
// Willhaben Marketplace Categories: https://www.willhaben.at/sitemap/sitemapindex-marktplatz-detail.xml

exports.getListings = getListings;
exports.scrapeCategories = scrapeCategories;
exports.getCategoriesByName = getCategoriesByName;
exports.getCategoryById = getCategoryById;

/**
 * gets the listings from an URL
 * @param {string} url the URL
 * @returns {object} an array with all the listings
 */
function getListings(url) {
  return new Promise((res, rej) => {
    fetch(url)
      .then((res) => res.text())
      .then((string) => {
        const temp = string.substring(
          string.indexOf(
            '<script id="__NEXT_DATA__" type="application/json">'
          ) + '<script id="__NEXT_DATA__" type="application/json">'.length
        );
        const result = JSON.parse(temp.substring(0, temp.indexOf("</script>")));
        const returnArray = [];

        result.props.pageProps.searchResult?.advertSummaryList.advertSummary.forEach(
          (returnObj) => {
            returnObj.attributes.attribute.forEach((element) => {
              returnObj[element.name.toLowerCase()] = isNaN(element.values[0])
                ? element.values[0]
                : +element.values[0];
            });

            // delete useless keys
            delete returnObj.attributes;
            delete returnObj.contextLinkList;
            delete returnObj.advertiserInfo;
            delete returnObj.advertImageList;

            returnArray.push(returnObj);
          }
        );

        res(returnArray);
      });
  });
}

/**
 * Scraper for all categories, will save them to a json file
 * @returns URI of saved categories json
 */
async function scrapeCategories() {
  return await new Promise(async (resolve, reject) => {
    const categories = [];
    let categoryCounter = 0;
    do {
      const uri =
        categories.length == 0
          ? "https://www.willhaben.at/iad/kaufen-und-verkaufen/marktplatz?rows=1"
          : categories[categoryCounter - 1].uri;
      const res = await fetch(uri);
      const string = await res.text();
      const temp = string.substring(
        string.indexOf('<script id="__NEXT_DATA__" type="application/json">') +
          '<script id="__NEXT_DATA__" type="application/json">'.length
      );
      const result = JSON.parse(temp.substring(0, temp.indexOf("</script>")));
      categoryCounter++;

      result.props.pageProps.searchResult.navigatorGroups[0].navigatorList
        .filter((ng) => ng.id == "category")[0]
        .groupedPossibleValues[0]?.possibleValues.forEach((pv) => {
          categories.push({
            label: pv.label,
            id: pv.urlParamRepresentationForValue[0].value,
            uri: pv.webLink.uri,
          });
        });
      console.log(categoryCounter + " from " + categories.length);

      await fsp.writeFile("./categories.json", JSON.stringify(categories));
    } while (categoryCounter < categories.length);
    resolve("./categories.json");
  });
}

function getCategoriesByName(categoryName) {
  try {
    const fileContent = fs.readFileSync("./categories.json");
    const categories = JSON.parse(fileContent);
    return categories.filter((c) => c.label == categoryName);
  } catch (err) {
    throw new Error("categories.json could not be read in root");
  }
}

function getCategoryById(categoryId) {
  try {
    const fileContent = fs.readFileSync("./categories.json");
    const categories = JSON.parse(fileContent);
    return categories.filter((c) => c.id == categoryId)[0];
  } catch (err) {
    throw new Error("categories.json could not be read in root");
  }
}

const conditions = Object.freeze({
  neu: 22,
  gebraucht: 23,
  defekt: 24,
  neuwertig: 2546,
  ausstellungsstueck: 2539,
  generalueberholt: 5013256,
});
exports.getConditions = conditions;

const transferType = Object.freeze({
  selbstabholung: 2536,
  versand: 2537,
});
exports.getTransferTypes = transferType;

const sortOrders = Object.freeze({
  aktualitaet: 1,
  preisAufsteigend: 3,
  preisAbsteigend: 4,
  relevanz: 7,
});
exports.getSortOrders = sortOrders;

const areaIds = Object.freeze({
  burgenland: {
    all: "1",
    eisenstadt: "101",
    eisenstadt_umgebung: "103",
    guessing: "104",
    jennersdorf: "105",
    mattersburg: "106",
    neusiedl_am_see: "107",
    oberpullendorf: "108",
    oberwart: "109",
    rust_stadt: "102",
  },
  kaernten: {
    all: "2",
    feldkirchen: "210",
    hermagor: "203",
    klagenfurt: "201",
    klagenfurt_land: "204",
    sankt_veit_an_der_glan: "205",
    spittal_an_der_drau: "206",
    villach: "202",
    villach_land: "207",
    voelkermarkt: "208",
    wolfsberg: "209",
  },
  niederoesterreich: {
    all: "3",
    amstetten: "305",
    baden: "306",
    bruck_an_der_leitha: "307",
    gmuend: "309",
    gaenserndorf: "308",
    hollabrunn: "310",
    horn: "311",
    korneuburg: "312",
    krems_an_der_donau: "301",
    krems_land: "313",
    lilienfeld: "314",
    melk: "315",
    mistelbach: "316",
    moedling: "317",
    neunkirchen: "318",
    sankt_poelten: "302",
    sankt_poelten_land: "319",
    scheibbs: "320",
    tulln: "321",
    waidhofen_an_der_thaya: "322",
    waidhofen_an_der_ybbs: "303",
    wiener_neustadt: "304",
    wiener_neustadt_land: "323",
    zwettl: "325",
  },
  oberoesterreich: {
    all: "4",
    braunau_am_inn: "404",
    eferding: "405",
    freistadt: "406",
    gmunden: "407",
    grieskirchen: "408",
    kirchdorf_an_der_krems: "409",
    linz: "401",
    linz_land: "410",
    perg: "411",
    ried_im_innkreis: "412",
    rohrbach: "413",
    schaerding: "414",
    steyr: "402",
    steyr_land: "415",
    urfahr_umgebung: "416",
    voecklabruck: "417",
    wels: "403",
    wels_land: "418",
  },
  salzburg: {
    all: "5",
    hallein: "502",
    salzburg_stadt: "501",
    salzburg_umgebung: "503",
    sankt_johann_im_pongau: "504",
    tamsweg: "505",
    zell_am_see: "506",
  },
  steiermark: {
    all: "6",
    bruck_muerzzuschlag: "621",
    deutschlandsberg: "603",
    graz: "601",
    graz_umgebung: "606",
    hartberg_fuerstenfeld: "622",
    leibnitz: "610",
    leoben: "611",
    liezen: "612",
    murau: "614",
    murtal: "620",
    suedoststeiermark: "623",
    voitsberg: "616",
    weiz: "617",
  },
  tirol: {
    all: "7",
    imst: "702",
    innsbruck: "701",
    innsbruck_land: "703",
    kitzbuehel: "704",
    kufstein: "705",
    landeck: "706",
    lienz: "707",
    reutte: "708",
    schwaz: "709",
  },
  vorarlberg: {
    all: 8,
    bludenz: "801",
    bregenz: "802",
    dornbirn: "803",
    feldkirch: "804",
  },
  wien: {
    all: "900",
    wien_01_bezirk_innere_stadt: "117223",
    wien_02_bezirk_leopoldstadt: "117224",
    wien_03_bezirk_landstrasse: "117225",
    wien_04_bezirk_wieden: "117226",
    wien_05_bezirk_margareten: "117227",
    wien_06_bezirk_mariahilf: "117228",
    wien_07_bezirk_neubau: "117229",
    wien_08_bezirk_josefstadt: "117230",
    wien_09_bezirk_alsergrund: "117231",
    wien_10_bezirk_favoriten: "117232",
    wien_11_bezirk_simmering: "117233",
    wien_12_bezirk_meidling: "117234",
    wien_13_bezirk_hietzing: "117235",
    wien_14_bezirk_penzing: "117236",
    wien_15_bezirk_rudolfsheim_fuenfhaus: "117237",
    wien_16_bezirk_ottakring: "117238",
    wien_17_bezirk_hernals: "117239",
    wien_18_bezirk_waehring: "117240",
    wien_19_bezirk_doebling: "117241",
    wien_20_bezirk_brigittenau: "117242",
    wien_21_bezirk_floridsdorf: "117243",
    wien_22_bezirk_donaustadt: "117244",
    wien_23_bezirk_liesing: "117245",
  },
  andereLänder: {
    all: "22000",
    bosnien_und_herzegowina: "-122",
    bulgarien: "-119",
    deutschland: "-137",
    frankreich: "-166",
    griechenland: "-22",
    grossbritannien: "-21",
    italien: "-127",
    kroatien: "-128",
    malta: "-130",
    niederlande: "-57",
    polen: "-44",
    portugal: "-132",
    schweiz: "-13",
    serbien: "20784",
    slowakei: "-168",
    slowenien: "-169",
    spanien: "-134",
    tschechien: "-136",
    tuerkei: "-53",
    ungarn: "-139",
    usa: "-158",
    zypern: "-14",
  },
});

exports.getAreadId = areaIds;

exports.new = () => new WillhabenSearch();

function buildAreaFilter(areaIds) {
  let filter = "";
  areaIds.forEach((areaId) => {
    filter += `&areaId=${areaId}`;
  });
  return filter;
}

class WillhabenSearch {
  constructor() {
    this.searchCount = 100;
    this.searchCategory = 0;
    this.searchContition = [];
    this.searchTransferType = [];
    this.searchAreaIds = [];
    this.searchPayLivery = false;
    this.searchPeriode = 0;
    this.searchPriceFrom = null;
    this.searchPriceTo = null;
    this.searchSortOrder = 0;
  }

  category(categoryId) {
    const category = getCategoryById(categoryId);
    this.searchCategory = category.uri.substring(
      category.uri.lastIndexOf("/") + 1
    );
    return this;
  }

  condition(condition) {
    if (
      !Object.values(conditions).includes(+condition) ||
      !Number.isInteger(condition)
    )
      throw new Error(
        "Invalid condition! use .getConditions() on the imported module to get the available conditions!"
      );
    if (!this.searchContition.includes(+condition))
      this.searchContition.push(+condition);
    return this;
  }

  transferType(transfer) {
    if (
      !Object.values(transferTypes).includes(+transfer) ||
      !Number.isInteger(transfer)
    )
      throw new Error(
        "Invalid transfer type! use .getTransfers() on the imported module to get the available types!"
      );
    if (!this.searchTransferType.includes(+transfer))
      this.searchTransferType.push(+transfer);
    return this;
  }

  count(count) {
    if (!Number.isInteger(count) || count < 1)
      throw new Error("Count has to be a positive integer!");
    this.searchCount = count;
    return this;
  }

  paylivery(paylivery) {
    if (typeof paylivery != "boolean")
      throw new Error("Paylivery can either be true of false!");
    this.searchPayLivery = paylivery;
    return this;
  }

  keyword(keyword) {
    this.searchKeyword = keyword;
    return this;
  }

  /**
   * @param periode Number of days to search for
   */
  periode(periode) {
    if (!Number.isInteger(periode) || periode < 0)
      throw new Error("Periode must be a positive integer");
    this.searchPeriode = periode;
    return this;
  }

  priceFrom(priceFrom) {
    if (!Number.isInteger(priceFrom) || priceFrom < 0)
      throw new Error("Price must be a positive integer");
    this.searchPriceFrom = priceFrom;
    return this;
  }

  priceTo(priceTo) {
    if (!Number.isInteger(priceTo) || priceTo < 0)
      throw new Error("Price must be a positive integer");
    this.searchPriceTo = priceTo;
    return this;
  }

  sortBy(searchOrder) {
    this.searchSortOrder = searchOrder;
    return this;
  }

  areaIds(areaIds) {
    this.searchAreaIds = areaIds;
    return this;
  }

  getURL() {
    return `https://willhaben.at/iad/kaufen-und-verkaufen/marktplatz/-${
      this.searchCategory
    }?rows=${this.searchCount}${
      this.searchContition.length == 0
        ? ""
        : "&treeAttributes=" + this.searchContition.join("&treeAttributes=")
    }${
      this.searchTransferType.length == 0
        ? ""
        : "&treeAttributes=" + this.searchTransferType.join("&treeAttributes=")
    }${this.searchPayLivery ? "&paylivery=true" : ""}${
      this.searchKeyword
        ? `&keyword=${this.searchKeyword.split(" ").join("+")}`
        : ""
    }${this.searchPeriode ? `&periode=${this.searchPeriode}` : ""}${
      this.searchPriceFrom != null ? `&PRICE_FROM=${this.searchPriceFrom}` : ""
    }${this.searchPriceTo != null ? `&PRICE_TO=${this.searchPriceTo}` : ""}
    ${this.searchSortOrder ? `&sort=${this.searchSortOrder}` : ""}
    ${this.areaIds.length != 0 ? buildAreaFilter(this.searchAreaIds) : ""}`;
  }

  search() {
    return getListings(this.getURL());
  }
}
