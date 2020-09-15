/* Popup a message window
 * where the user has to manually enter the resource ID
 * to enable the destroy button
 */
Ext.define('Proxmox.window.SafeDestroy', {
    extend: 'Ext.window.Window',
    alias: 'proxmoxSafeDestroy',

    title: gettext('Confirm'),
    modal: true,
    buttonAlign: 'center',
    bodyPadding: 10,
    width: 450,
    layout: { type: 'hbox' },
    defaultFocus: 'confirmField',
    showProgress: false,

    config: {
	item: {
	    id: undefined,
	    purgeable: false,
	},
	url: undefined,
	taskName: undefined,
	params: {},
    },

    getParams: function() {
	let me = this;
	const purgeCheckbox = me.lookupReference('purgeCheckbox');
	if (purgeCheckbox.checked) {
	    me.params.purge = 1;
	}
	if (Ext.Object.isEmpty(me.params)) {
	    return '';
	}
	return '?' + Ext.Object.toQueryString(me.params);
    },

    controller: {

	xclass: 'Ext.app.ViewController',

	control: {
	    'field[name=confirm]': {
		change: function(f, value) {
		    const view = this.getView();
		    const removeButton = this.lookupReference('removeButton');
		    if (value === view.getItem().id.toString()) {
			removeButton.enable();
		    } else {
			removeButton.disable();
		    }
		},
		specialkey: function(field, event) {
		    const removeButton = this.lookupReference('removeButton');
		    if (!removeButton.isDisabled() && event.getKey() === event.ENTER) {
			removeButton.fireEvent('click', removeButton, event);
		    }
		},
	    },
           'button[reference=removeButton]': {
		click: function() {
		    const view = this.getView();
		    Proxmox.Utils.API2Request({
			url: view.getUrl() + view.getParams(),
			method: 'DELETE',
			waitMsgTarget: view,
			failure: function(response, opts) {
			    view.close();
			    Ext.Msg.alert('Error', response.htmlStatus);
			},
			success: function(response, options) {
			    const hasProgressBar = !!(view.showProgress &&
				response.result.data);

			    if (hasProgressBar) {
				// stay around so we can trigger our close events
				// when background action is completed
				view.hide();

				const upid = response.result.data;
				const win = Ext.create('Proxmox.window.TaskProgress', {
				    upid: upid,
				    listeners: {
					destroy: function() {
					    view.close();
					},
				    },
				});
				win.show();
			    } else {
				view.close();
			    }
			},
		    });
		},
            },
	},
    },

    items: [
	{
	    xtype: 'component',
	    cls: [Ext.baseCSSPrefix + 'message-box-icon',
		   Ext.baseCSSPrefix + 'message-box-warning',
		   Ext.baseCSSPrefix + 'dlg-icon'],
	},
	{
	    xtype: 'container',
	    flex: 1,
	    layout: {
		type: 'vbox',
		align: 'stretch',
	    },
	    items: [
		{
		    xtype: 'component',
		    reference: 'messageCmp',
		},
		{
		    itemId: 'confirmField',
		    reference: 'confirmField',
		    xtype: 'textfield',
		    name: 'confirm',
		    labelWidth: 300,
		    hideTrigger: true,
		    allowBlank: false,
		},
		{
		    xtype: 'proxmoxcheckbox',
		    name: 'purge',
		    reference: 'purgeCheckbox',
		    boxLabel: gettext('Purge'),
		    checked: false,
		    autoEl: {
			tag: 'div',
			'data-qtip': gettext('Remove from replication and backup jobs'),
		    },
		},
	    ],
	},
    ],
    buttons: [
	{
	    reference: 'removeButton',
	    text: gettext('Remove'),
	    disabled: true,
	},
    ],

    initComponent: function() {
	let me = this;

	me.callParent();

	const item = me.getItem();

	if (!Ext.isDefined(item.id)) {
	    throw "no ID specified";
	}

	const messageCmp = me.lookupReference('messageCmp');
	let msg;

	if (Ext.isDefined(me.getTaskName())) {
	    msg = Proxmox.Utils.format_task_description(me.getTaskName(), item.id);
	    messageCmp.setHtml(msg);
	} else {
	    throw "no task name specified";
	}

	if (!item.purgeable) {
	    const purgeCheckbox = me.lookupReference('purgeCheckbox');
	    purgeCheckbox.setDisabled(true);
	    purgeCheckbox.setHidden(true);
	}

	const confirmField = me.lookupReference('confirmField');
	msg = gettext('Please enter the ID to confirm') +
	    ' (' + item.id + ')';
	confirmField.setFieldLabel(msg);
    },
});
