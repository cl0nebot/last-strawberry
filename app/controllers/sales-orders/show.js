import Ember from "ember";
import computed from "ember-computed-decorators";

export default Ember.Controller.extend({
  firebaseMgr: Ember.inject.service(),

  cleanup() {
    if(this.locationItemMetaStream !== undefined){
      this.locationItemMetaStream.onCompleted();
    }
  },

  processSnapshot(snapshot) {
    const data = snapshot.val();

    this.set("loadingFbData", false);
    this.set("rawSalesData", _.map(data));
  },

  willDestroy() {
    this.cleanup();
  },

  @computed("items.@each.{isSold,active}", "model.orderItems.[]")
  filteredItems(items, orderItems) {
    return items
      .filter(item => {
      const matchingOrderItem = orderItems.any(oi => oi.get("item.id") === item.get("id"));

      return item.get("isSold") && item.get("active") && !matchingOrderItem;
      })
      .sortBy("name");
  },

  @computed("salesOrders.@each.{totalQuantity}")
  itemTotals(orders = Ember.A()) {
    return _
      .chain(orders.toArray())
      .map(order => order.get("orderItems").toArray())
      .flatten()
      .groupBy(orderItem => orderItem.get("item.id"))
      .mapValues(orderItems => orderItems.reduce((acc, cur) => acc + Number(cur.get("quantity")), 0))
      .map((quantity, id) => ({id, quantity}))
      .reduce((acc, cur) => {
        acc[cur.id] = cur.quantity;
        return acc;
      }, {})
      .value();
  },

  @computed("rawSalesData.@each.{ts}")
  salesData(dataPoints = []) {
    return dataPoints.sortBy("ts");
  },

  loadSalesData() {
    this.cleanup();
    this.set("loadingFbData", true);

    const itemCode = this.get("item.code"),
          locationCode = this.get("model.location.code"),
          dataPath = `locations/${locationCode}/${itemCode}`,
          fbRef = this.get("firebaseMgr").buildRef(dataPath).orderByChild("ts").limitToLast(10);

    this.locationItemMetaStream = new Rx.Subject();

    this.locationItemMetaStream
      .subscribe(
        () => fbRef.on("value", ::this.processSnapshot, this.errorHander, this),
        () => {},
        () => fbRef.off("value", ::this.processSnapshot, this));

    this.locationItemMetaStream.onNext();
  },

  actions: {
    onOrderItemChange(item) {
      this.set("item", item);
      this.loadSalesData();
    }
  }
});
