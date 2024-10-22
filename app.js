const fetch = require("node-fetch");
const fs = require("node:fs/promises");

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

        result.props.pageProps.searchResult.advertSummaryList.advertSummary.forEach(
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

      await fs.writeFile("./categories.json", JSON.stringify(categories));
    } while (categoryCounter < categories.length);
    resolve("./categories.json");
  });
}

async function getCategoriesByName(categoryName) {
  const fileContent = await fs.readFile("./categories.json");
  const categories = JSON.parse(fileContent);
  return categories.filter((c) => c.label == categoryName);
}

async function getCategoryById(categoryId) {
  const fileContent = await fs.readFile("./categories.json");
  const categories = JSON.parse(fileContent);
  return categories.filter((c) => c.id == categoryId)[0];
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

exports.new = () => new WillhabenSearch();

class WillhabenSearch {
  constructor() {
    this.searchCount = 100;
    this.searchCategory = 0;
    this.searchContition = [];
    this.searchTransferType = [];
    this.searchPayLivery = false;
    this.searchPeriode = 0;
    this.searchPriceFrom = null;
    this.searchPriceTo = null;
  }

  category(categoryId) {
    return getCategoryById(categoryId).then((category) => {
      this.searchCategory = category.uri.substring(
        category.uri.lastIndexOf("/") + 1
      );
      return this;
    });
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
    }${this.searchPriceTo != null ? `&PRICE_TO=${this.searchPriceTo}` : ""}`;
  }

  search() {
    return getListings(this.getURL());
  }
}
