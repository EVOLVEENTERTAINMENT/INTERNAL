// Pipeline and Money through the real forms: a lead, an invoice and a cost.
'use strict';
module.exports = {
  main: async ctx => {
    const v = await ctx.page(async H => {
      await H.tab('pipe');
      H.t('pipeline: title is Pipeline', H.text('#ptitle') === 'Pipeline', H.text('#ptitle'));
      H.t('pipeline: the sample lead shows', H.has('#stage', 'Sample Bakery'));
      pipeAdd(); await H.wait(150);
      H.t('pipeline: the add form opens', !!H.$('.veil .modal'));
      H.fill({ 0: 'Sample Lead Co', 3: '2500' }); H.modal('Save'); await H.wait(400);
      const lead = Object.keys(S.pipe).map(k => S.pipe[k]).filter(r => r.name === 'Sample Lead Co')[0];
      H.t('pipeline: the lead saves with value_num 2500', !!lead && lead.value_num === 2500, lead ? JSON.stringify({ value: lead.value, value_num: lead.value_num }) : 'none');
      H.t('pipeline: the lead shows on the page', H.has('#stage', 'Sample Lead Co'));

      await H.tab('money');
      H.t('money: title is Money', H.text('#ptitle') === 'Money', H.text('#ptitle'));
      H.t('money: the sample invoice shows', H.has('#stage', 'Sample Cafe'));
      invAdd(); await H.wait(150);
      H.t('money: the invoice form opens', !!H.$('.veil .modal'));
      H.fill({ 0: 'Sample Client', 2: 'Sample brand film, first half', 3: '1500' }); H.modal('Save'); await H.wait(400);
      const inv = (S.inv || []).filter(r => r.client === 'Sample Client' && r.amount === 1500)[0];
      H.t('money: the invoice saves as sent', !!inv && inv.state === 'sent', inv ? inv.id : 'none');
      H.t('money: the invoice shows on the page', H.has('#stage', 'Sample Client'));
      costEdit(null); await H.wait(150);
      H.t('money: the cost form opens', !!H.$('.veil .modal'));
      H.fill({ 0: 'Sample rent', 1: '1200' }); H.modal('Save'); await H.wait(400);
      const cost = (S.costs || []).filter(c => c.name === 'Sample rent')[0];
      H.t('money: the cost saves', !!cost && cost.amount === 1200, cost ? cost.id : 'none');
      return { lead: lead && lead.id, inv: inv && inv.id, cost: cost && cost.id };
    });
    const lead = v && v.lead ? ctx.readCol('pipeline')[v.lead] : null;
    ctx.t('pipeline: the lead is on disk with value_num', !!lead && lead.data.value_num === 2500, lead ? JSON.stringify(lead.data).slice(0, 120) : 'missing');
    const inv = v && v.inv ? ctx.readCol('invoices')[v.inv] : null;
    ctx.t('money: the invoice is on disk', !!inv && inv.data.amount === 1500, inv ? JSON.stringify(inv.data).slice(0, 120) : 'missing');
    const cost = v && v.cost ? ctx.readCol('costs')[v.cost] : null;
    ctx.t('money: the cost is on disk', !!cost && cost.data.amount === 1200, cost ? JSON.stringify(cost.data).slice(0, 120) : 'missing');
  }
};
