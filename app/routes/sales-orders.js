import AuthenticatedRouteMixin from "ember-simple-auth/mixins/authenticated-route-mixin";
import Ember from "ember";
import config from "last-strawberry/config/environment";

const COMPANY_INCLUDES = [
  "locations",
  "locations.company",
  "price-tier",
  "price-tier.item-prices",
  "price-tier.item-prices.item"
];

const ORDER_INCLUDES = [
	"order-items",
	"order-items.item",
  "location",
  "location.company"
];

export default Ember.Route.extend(AuthenticatedRouteMixin, {
  session: Ember.inject.service(),

  queryParams: {
    deliveryDate: {
      refreshModel: true
    },
    includePublished: {
      refreshModel: false
    },
    includeUnpublished: {
      refreshModel: false
    },
    companyQuery: {
      refreshModel: false
    },
    includedItems: {
      refreshModel: false
    }
  },

	setupController(controller, model) {
		controller.set("salesOrders", this.store.peekAll("order"));
		controller.set("companies", this.store.peekAll("company"));
    controller.set("locations", this.store.peekAll("location"));
    controller.set("items", this.store.peekAll("item"));

    this._super(controller, model);
	},

	model(params){
    return Ember.RSVP.all([
      this.store.query("item", {"filter[is_sold]":true}),
      this.store.query("company", {include:COMPANY_INCLUDES.join(",")}),
      this.store.query("order", {
        "filter[order_type]":"sales-order",
        "filter[delivery_date]":params.deliveryDate,
        include:ORDER_INCLUDES.join(",")
      })
    ]);
	},

  showSalesOrder(order) {
    this.transitionTo("sales-orders.show", order.get("id"));
  },

  transitionToDate(toDate) {
    const currentDate = this.paramsFor("sales-orders").deliveryDate;
    const newDate = moment(toDate).format("YYYY-MM-DD");

    if(newDate !== currentDate) {
      this.controllerFor("sales-orders").set("deliveryDate", newDate);
      this.transitionTo("sales-orders");
    }
  },

  actions: {
    onOrderSelected(order) {
      this.showSalesOrder(order);
    },

    async createSalesOrder(location) {
      const deliveryDate = this.paramsFor("sales-orders").deliveryDate;
      const order = await this.store
        .createRecord("order", {location, deliveryDate})
        .save();

      this.showSalesOrder(order);
    },

    stubOrders () {
      const deliveryDate = this.paramsFor("sales-orders").deliveryDate;

      this.controllerFor("sales-orders").set("isStubbing", true);

      this.get("session").authorize("authorizer:devise", async (headerName, headerValue) => {

        const headers = {};
        headers[headerName] = headerValue;
        const payload = {
          url:`${config.apiHost}/orders/stub_orders`,
          data:{deliveryDate},
          headers,
          type:"POST"
        };

        const newOrders = await Ember.$.ajax(payload);
        this.store.pushPayload(newOrders);

        this.controllerFor("sales-orders").set("isStubbing", false);

      });
    },

    duplicateOrders(fromDate, toDate) {
      return new Ember.RSVP.Promise((res, rej) => {
        this.get("session").authorize("authorizer:devise", (headerName, headerValue) => {

          const headers = {};
          headers[headerName] = headerValue;
          const payload = {
            url:`${config.apiHost}/orders/duplicate_sales_orders`,
            data:{fromDate, toDate},
            headers,
            type:"POST"
          };

          Ember.$.ajax(payload)
            .always(response => {
              if(response.status) {
                res();
                this.transitionToDate(toDate);
              } else {
                rej(response.message);
              }
            });
        });
      });
    },

    onDateSelected(date) {
      this.transitionToDate(date);
    }
  }
});
