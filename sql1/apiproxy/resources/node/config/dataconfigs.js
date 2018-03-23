var dataconfigs = {
      productFields: [
        "ProductID",
        "Name",
        "ProductNumber",
        "Color",
        "StandardCost",
        "ListPrice",
        "Size",
        "Weight",
        "ProductCategoryID",
        "ProductModelID",
        "SellStartDate",
        "SellEndDate",
        "DiscontinuedDate"
      ]
    };

dataconfigs.productQuery ="SELECT " + dataconfigs.productFields.join(',') + " FROM SalesLT.Product";
module.exports = dataconfigs;
