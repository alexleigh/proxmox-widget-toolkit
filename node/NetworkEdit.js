Ext.define('Proxmox.node.NetworkEdit', {
    extend: 'Proxmox.window.Edit',
    alias: ['widget.proxmoxNodeNetworkEdit'],

    initComponent : function() {
	var me = this;

	if (!me.nodename) {
	    throw "no node name specified";
	}

	if (!me.iftype) {
	    throw "no network device type specified";
	}

	me.isCreate = !me.iface;

	var iface_vtype;

	if (me.iftype === 'bridge') {
	    iface_vtype = 'BridgeName';
	} else if (me.iftype === 'bond') {
	    iface_vtype = 'BondName';
	} else if (me.iftype === 'eth' && !me.isCreate) {
	    iface_vtype = 'InterfaceName';
	} else if (me.iftype === 'vlan' && !me.isCreate) {
	    iface_vtype = 'InterfaceName';
	} else if (me.iftype === 'OVSBridge') {
	    iface_vtype = 'BridgeName';
	} else if (me.iftype === 'OVSBond') {
	    iface_vtype = 'BondName';
	} else if (me.iftype === 'OVSIntPort') {
	    iface_vtype = 'InterfaceName';
	} else if (me.iftype === 'OVSPort') {
	    iface_vtype = 'InterfaceName';
	} else {
	    console.log(me.iftype);
	    throw "unknown network device type specified";
	}

	me.subject = Proxmox.Utils.render_network_iface_type(me.iftype);

	var column2 = [];

	if (!(me.iftype === 'OVSIntPort' || me.iftype === 'OVSPort' ||
	      me.iftype === 'OVSBond')) {
	    column2.push({
		xtype: 'proxmoxcheckbox',
		fieldLabel: gettext('Autostart'),
		name: 'autostart',
		uncheckedValue: 0,
		checked: me.isCreate ? true : undefined
	    });
	}

	if (me.iftype === 'bridge') {
	    column2.push({
		xtype: 'proxmoxcheckbox',
		fieldLabel: gettext('VLAN aware'),
		name: 'bridge_vlan_aware',
		deleteEmpty: !me.isCreate
	    });
	    column2.push({
		xtype: 'textfield',
		fieldLabel: gettext('Bridge ports'),
		name: 'bridge_ports'
	    });
	} else if (me.iftype === 'OVSBridge') {
	    column2.push({
		xtype: 'textfield',
		fieldLabel: gettext('Bridge ports'),
		name: 'ovs_ports'
	    });
	    column2.push({
		xtype: 'textfield',
		fieldLabel: gettext('OVS options'),
		name: 'ovs_options'
	    });
	} else if (me.iftype === 'OVSPort' || me.iftype === 'OVSIntPort') {
	    column2.push({
		xtype: me.isCreate ? 'PVE.form.BridgeSelector' : 'displayfield',
		fieldLabel: Proxmox.Utils.render_network_iface_type('OVSBridge'),
		allowBlank: false,
		nodename: me.nodename,
		bridgeType: 'OVSBridge',
		name: 'ovs_bridge'
	    });
	    column2.push({
		xtype: 'pveVlanField',
		deleteEmpty: !me.isCreate,
		name: 'ovs_tag',
		value: ''
	    });
	    column2.push({
		xtype: 'textfield',
		fieldLabel: gettext('OVS options'),
		name: 'ovs_options'
	    });
	} else if (me.iftype === 'bond') {
	    column2.push({
		xtype: 'textfield',
		fieldLabel: gettext('Slaves'),
		name: 'slaves'
	    });

	    var policySelector = Ext.createWidget('bondPolicySelector', {
		fieldLabel: gettext('Hash policy'),
		name: 'bond_xmit_hash_policy',
		deleteEmpty: !me.isCreate,
		disabled: true
	    });

	    var primaryfield = Ext.createWidget('textfield', {
		fieldLabel: gettext('bond-primary'),
		name: 'bond-primary',
		value: '',
		disabled: true
	    });

	    column2.push({
		xtype: 'bondModeSelector',
		fieldLabel: gettext('Mode'),
		name: 'bond_mode',
		value: me.isCreate ? 'balance-rr' : undefined,
		listeners: {
		    change: function(f, value) {
			if (value === 'balance-xor' ||
			    value === '802.3ad') {
			    policySelector.setDisabled(false);
			    primaryfield.setDisabled(true);
			    primaryfield.setValue('');
			} else if (value === 'active-backup') {
			    primaryfield.setDisabled(false);
			    policySelector.setDisabled(true);
			    policySelector.setValue('');
			} else {
			    policySelector.setDisabled(true);
			    policySelector.setValue('');
			    primaryfield.setDisabled(true);
			    primaryfield.setValue('');
			}
		    }
		},
		allowBlank: false
	    });

	    column2.push(policySelector);
	    column2.push(primaryfield);

	} else if (me.iftype === 'OVSBond') {
	    column2.push({
		xtype: me.isCreate ? 'PVE.form.BridgeSelector' : 'displayfield',
		fieldLabel: Proxmox.Utils.render_network_iface_type('OVSBridge'),
		allowBlank: false,
		nodename: me.nodename,
		bridgeType: 'OVSBridge',
		name: 'ovs_bridge'
	    });
	    column2.push({
		xtype: 'pveVlanField',
		deleteEmpty: !me.isCreate,
		name: 'ovs_tag',
		value: ''
	    });
	    column2.push({
		xtype: 'textfield',
		fieldLabel: gettext('OVS options'),
		name: 'ovs_options'
	    });
	}

	column2.push({
	    xtype: 'textfield',
	    fieldLabel: gettext('Comment'),
	    allowBlank: true,
	    nodename: me.nodename,
	    name: 'comments'
	});

	var url;
	var method;

	if (me.isCreate) {
	    url = "/api2/extjs/nodes/" + me.nodename + "/network";
	    method = 'POST';
	} else {
	    url = "/api2/extjs/nodes/" + me.nodename + "/network/" + me.iface;
	    method = 'PUT';
	}

	var column1 = [
	    {
		xtype: 'hiddenfield',
		name: 'type',
		value: me.iftype
	    },
	    {
		xtype: me.isCreate ? 'textfield' : 'displayfield',
		fieldLabel: gettext('Name'),
		name: 'iface',
		value: me.iface,
		vtype: iface_vtype,
		allowBlank: false
	    }
	];

	if (me.iftype === 'OVSBond') {
	    column1.push(
		{
		    xtype: 'bondModeSelector',
		    fieldLabel: gettext('Mode'),
		    name: 'bond_mode',
		    openvswitch: true,
		    value: me.isCreate ? 'active-backup' : undefined,
		    allowBlank: false
		},
		{
		    xtype: 'textfield',
		    fieldLabel: gettext('Slaves'),
		    name: 'ovs_bonds'
		}
	    );
	} else {

	    column1.push(
		{
		    xtype: 'proxmoxtextfield',
		    deleteEmpty: !me.isCreate,
		    fieldLabel: 'IPv4/CIDR',
		    vtype: 'IPCIDRAddress',
		    name: 'cidr'
		},
		{
		    xtype: 'proxmoxtextfield',
		    deleteEmpty: !me.isCreate,
		    fieldLabel: gettext('Gateway') + ' (IPv4)',
		    vtype: 'IPAddress',
		    name: 'gateway'
		},
		{
		    xtype: 'proxmoxtextfield',
		    deleteEmpty: !me.isCreate,
		    fieldLabel: 'IPv6/CIDR',
		    vtype: 'IP6CIDRAddress',
		    name: 'cidr6'
		},
		{
		    xtype: 'proxmoxtextfield',
		    deleteEmpty: !me.isCreate,
		    fieldLabel: gettext('Gateway') + ' (IPv6)',
		    vtype: 'IP6Address',
		    name: 'gateway6'
		},
		{
		    xtype: 'proxmoxintegerfield',
		    minValue: 1280,
		    maxValue: 65520,
		    deleteEmpty: !me.isCreate,
		    fieldLabel: 'MTU',
		    name: 'mtu'
		}
	    );
	}

	Ext.applyIf(me, {
	    url: url,
	    method: method,
	    items: {
                xtype: 'inputpanel',
		column1: column1,
		column2: column2
	    }
	});

	me.callParent();

	if (me.isCreate) {
	    me.down('field[name=iface]').setValue(me.iface_default);
	} else {
	    me.load({
		success: function(response, options) {
		    var data = response.result.data;
		    if (data.type !== me.iftype) {
			var msg = "Got unexpected device type";
			Ext.Msg.alert(gettext('Error'), msg, function() {
			    me.close();
			});
			return;
		    }
		    me.setValues(data);
		    me.isValid(); // trigger validation
		}
	    });
	}
    }
});
