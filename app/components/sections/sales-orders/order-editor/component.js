import Ember from 'ember';
import downloadFile from 'last-strawberry/utils/download-file';
import computed from 'ember-computed-decorators';

const { notEmpty } = Ember.computed;

export default Ember.Component.extend({
  classNames:       ['section_sales-order_order-editor', 'col'],

  pdfGenerator:     Ember.inject.service(),

  hasMissingItems:  notEmpty('missingItems'),
  
  @computed('model.orderItems.@each.{name}', 'items.@each.{name}')
  missingItems(orderItems, items) {
    return items
      .filter(item => !orderItems.any(oi => oi.get('item.name') === item.get('name')));
  },

  actions: {
    printOrder() {
      return this.get('pdfGenerator')
        .generateInvoices([this.get('model')])
        .then(pdfData => downloadFile(pdfData.url, `${this.get('model.orderNumber')}.pdf`))
        .catch(err => err);
    },

    createOrderItem(item) {
      this.set('customAddItemResult', undefined);
      this.attrs.createOrderItem(item);
    }
  }
});
