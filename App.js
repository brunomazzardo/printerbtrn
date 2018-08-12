
import React, { Component } from 'react'
import {
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    TouchableHighlight,
    View,
    Modal,
    ActivityIndicator,
    Image
} from 'react-native'

import BluetoothSerial from 'react-native-bluetooth-serial'
import { Buffer } from 'buffer'
global.Buffer = Buffer
const iconv = require('iconv-lite')
import { EscPos } from 'escpos-xml';
import xml2js from "react-native-xml2js";

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<document>
    <line-feed />
    <align mode="center">
        <bold>
            <text-line size="1:0">{{name}}</text-line>
        </bold>
        <line-feed />
        <small>
            <text-line size="1:0">---------------------</text-line>
            <text-line size="1:0">523-670-643</text-line>
            <text-line size="1:0">---------------------</text-line>
        </small>
        <line-feed />
        <text-line>Garagem da Julho</text-line>
        <text-line>Av. Julho de Castilhos 54</text-line>
        <text-line>CNPJ: 09.550.403/001-89</text-line>
        <line-feed/>
        <bold>
            <text-line size="1:0">TICKET</text-line>
            <text-line size="1:0">DE ENTRADA</text-line>
        </bold>
    </align>
    <line-feed/>
    <align mode="left">
        <bold>
            <text-line size="0.5:0">DATA HORA</text-line>
            <text-line>{{moment date format="DD/MM/YYYY HH:mm:ss"}}</text-line>
        </bold>
    </align>
    <line-feed />
    <align mode="left">
        <bold>
            <text-line size="0.5:0">CUPOM</text-line>
            <text-line>1280</text-line>
        </bold>
    </align>
    <line-feed />
    <align mode="left">
        <bold>
            <text-line size="0.5:0">Placa</text-line>
            <text-line>8212</text-line>
        </bold>
    </align>
    <align mode ="center">
        <bold>
            <text-line> Tabela de preços  </text-line>
         </bold>   
    </align>
    <line-feed/>
        <bold>
            <text-line size="0.5:0" >Preço Inicial:     R$30 </text-line>
            <text-line size="0.5:0" >Apos 30 min:       R$10 </text-line>
            <text-line size="0.5:0" >Maximo:            R$30</text-line>
            <text-line size="0.5:0" >Antecipado:        R$30</text-line>
        </bold>
    <line-feed/>
    <line-feed/>
</document>`
const data = {
    name : 'Estacione Aqui' ,
    date:new Date()
}

const buffer_data = EscPos.getBufferFromTemplate(xml, data);

const Button = ({ title, onPress, style, textStyle }) =>
    <TouchableOpacity style={[ styles.button, style ]} onPress={onPress}>
        <Text style={[ styles.buttonText, textStyle ]}>{title.toUpperCase()}</Text>
    </TouchableOpacity>


const DeviceList = ({ devices, connectedId, showConnectedIcon, onDevicePress }) =>
    <ScrollView style={styles.container}>
        <View style={styles.listContainer}>
            {devices.map((device, i) => {
                return (
                    <TouchableHighlight
                        underlayColor='#DDDDDD'
                        key={`${device.id}_${i}`}
                        style={styles.listItem} onPress={() => onDevicePress(device)}>
                        <View style={{ flexDirection: 'row' }}>
                            {showConnectedIcon
                                ? (
                                    <View style={{ width: 48, height: 48, opacity: 0.4 }}>
                                        {connectedId === device.id
                                            ? (
                                                <Text>
                                                  Deu
                                                </Text>
                                            ) : null}
                                    </View>
                                ) : null}
                            <View style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontWeight: 'bold' }}>{device.name}</Text>
                                <Text>{`<${device.id}>`}</Text>
                            </View>
                        </View>
                    </TouchableHighlight>
                )
            })}
        </View>
    </ScrollView>

export default class App extends Component {
    constructor (props) {
        super(props)
        this.state = {
            isEnabled: false,
            discovering: false,
            devices: [],
            unpairedDevices: [],
            connected: false,
            section: 0
        }
    }

    componentWillMount () {
        Promise.all([
            BluetoothSerial.isEnabled(),
            BluetoothSerial.list()
        ])
            .then((values) => {
                const [ isEnabled, devices ] = values
                this.setState({ isEnabled, devices })
            })

        BluetoothSerial.on('bluetoothEnabled', () => console.warn('Bluetooth enabled'))
        BluetoothSerial.on('bluetoothDisabled', () => console.warn('Bluetooth disabled'))
        BluetoothSerial.on('error', (err) => console.log(`Error: ${err.message}`))
        BluetoothSerial.on('connectionLost', () => {
            if (this.state.device) {
                console.warn(`Connection to device ${this.state.device.name} has been lost`)
            }
            this.setState({ connected: false })
        })
    }

    /**
     * [android]
     * request enable of bluetooth from user
     */
    requestEnable () {
        BluetoothSerial.requestEnable()
            .then((res) => this.setState({ isEnabled: true }))
            .catch((err) => console.warn(err.message))
    }

    /**
     * [android]
     * enable bluetooth on device
     */
    enable () {
        BluetoothSerial.enable()
            .then((res) => this.setState({ isEnabled: true }))
            .catch((err) => console.warn(err.message))
    }

    /**
     * [android]
     * disable bluetooth on device
     */
    disable () {
        BluetoothSerial.disable()
            .then((res) => this.setState({ isEnabled: false }))
            .catch((err) => console.warn(err.message))
    }

    /**
     * [android]
     * toggle bluetooth
     */
    toggleBluetooth (value) {
        if (value === true) {
            this.enable()
        } else {
            this.disable()
        }
    }

    /**
     * [android]
     * Discover unpaired devices, works only in android
     */
    discoverUnpaired () {
        if (this.state.discovering) {
            return false
        } else {
            this.setState({ discovering: true })
            BluetoothSerial.discoverUnpairedDevices()
                .then((unpairedDevices) => {
                    this.setState({ unpairedDevices, discovering: false })
                })
                .catch((err) => console.warn(err.message))
        }
    }

    /**
     * [android]
     * Discover unpaired devices, works only in android
     */
    cancelDiscovery () {
        if (this.state.discovering) {
            BluetoothSerial.cancelDiscovery()
                .then(() => {
                    this.setState({ discovering: false })
                })
                .catch((err) => console.warn(err.message))
        }
    }

    /**
     * [android]
     * Pair device
     */
    pairDevice (device) {
        BluetoothSerial.pairDevice(device.id)
            .then((paired) => {
                if (paired) {
                    console.warn(`Device ${device.name} paired successfully`)
                    const devices = this.state.devices
                    devices.push(device)
                    this.setState({ devices, unpairedDevices: this.state.unpairedDevices.filter((d) => d.id !== device.id) })
                } else {
                    console.warn(`Device ${device.name} pairing failed`)
                }
            })
            .catch((err) => console.warn(err.message))
    }

    /**
     * Connect to bluetooth device by id
     * @param  {Object} device
     */
    connect (device) {
        this.setState({ connecting: true })
        BluetoothSerial.connect(device.id)
            .then((res) => {
                console.warn(`Connected to device ${device.name}`)
                this.setState({ device, connected: true, connecting: false })
                this.write('oi')
            })
            .catch((err) => console.warn(err.message))
    }

    /**
     * Disconnect from bluetooth device
     */
    disconnect () {
        BluetoothSerial.disconnect()
            .then(() => this.setState({ connected: false }))
            .catch((err) => console.warn(err.message))
    }

    /**
     * Toggle connection when we have active device
     * @param  {Boolean} value
     */
    toggleConnect (value) {
        if (value === true && this.state.device) {
            this.connect(this.state.device)
        } else {
            this.disconnect()
        }
    }

    /**
     * Write message to device
     * @param  {String} message
     */
    write (message) {
        if (!this.state.connected) {
            console.warn('You must connect to device first')
        }

        BluetoothSerial.write(buffer_data)
            .then((res) => {
                console.warn('Successfuly wrote to device')
                this.setState({ connected: true })
            })
            .catch((err) => console.warn(err.message))
    }

    onDevicePress (device) {
        if (this.state.section === 0) {
            this.connect(device)
        } else {
            this.pairDevice(device)
        }
    }

    writePackets (message, packetSize = 64) {
        const toWrite = iconv.encode(message, 'cp852')
        const writePromises = []
        const packetCount = Math.ceil(toWrite.length / packetSize)

        for (var i = 0; i < packetCount; i++) {
            const packet = new Buffer(packetSize)
            packet.fill(' ')
            toWrite.copy(packet, 0, i * packetSize, (i + 1) * packetSize)
            writePromises.push(BluetoothSerial.write(packet))
        }

        Promise.all(writePromises)
            .then((result) => {
            })
    }

    render () {
        const activeTabStyle = { borderBottomWidth: 6, borderColor: '#009688' }
        return (
            <View style={{ flex: 1 }}>
                <View style={styles.topBar}>
                    <Text style={styles.heading}>Bluetooth Serial Example</Text>
                    {Platform.OS === 'android'
                        ? (
                            <View style={styles.enableInfoWrapper}>
                                <Text style={{ fontSize: 12, color: '#FFFFFF' }}>
                                    {this.state.isEnabled ? 'disable' : 'enable'}
                                </Text>
                                <Switch
                                    onValueChange={this.toggleBluetooth.bind(this)}
                                    value={this.state.isEnabled} />
                            </View>
                        ) : null}
                </View>

                {Platform.OS === 'android'
                    ? (
                        <View style={[styles.topBar, { justifyContent: 'center', paddingHorizontal: 0 }]}>
                            <TouchableOpacity style={[styles.tab, this.state.section === 0 && activeTabStyle]} onPress={() => this.setState({ section: 0 })}>
                                <Text style={{ fontSize: 14, color: '#FFFFFF' }}>PAIRED DEVICES</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tab, this.state.section === 1 && activeTabStyle]} onPress={() => this.setState({ section: 1 })}>
                                <Text style={{ fontSize: 14, color: '#FFFFFF' }}>UNPAIRED DEVICES</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                {this.state.discovering && this.state.section === 1
                    ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <ActivityIndicator
                                style={{ marginBottom: 15 }}
                                size={60} />
                            <Button
                                textStyle={{ color: '#FFFFFF' }}
                                style={styles.buttonRaised}
                                title='Cancel Discovery'
                                onPress={() => this.cancelDiscovery()} />
                        </View>
                    ) : (
                        <DeviceList
                            showConnectedIcon={this.state.section === 0}
                            connectedId={this.state.device && this.state.device.id}
                            devices={this.state.section === 0 ? this.state.devices : this.state.unpairedDevices}
                            onDevicePress={(device) => this.onDevicePress(device)} />
                    )}


                <View style={{ alignSelf: 'flex-end', height: 52 }}>
                    <ScrollView
                        horizontal
                        contentContainerStyle={styles.fixedFooter}>
                        {Platform.OS === 'android' && this.state.section === 1
                            ? (
                                <Button
                                    title={this.state.discovering ? '... Discovering' : 'Discover devices'}
                                    onPress={this.discoverUnpaired.bind(this)} />
                            ) : null}
                        {Platform.OS === 'android' && !this.state.isEnabled
                            ? (
                                <Button
                                    title='Request enable'
                                    onPress={() => this.requestEnable()} />
                            ) : null}
                    </ScrollView>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 0.9,
        backgroundColor: '#F5FCFF'
    },
    topBar: {
        height: 56,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center' ,
        elevation: 6,
        backgroundColor: '#7B1FA2'
    },
    heading: {
        fontWeight: 'bold',
        fontSize: 16,
        alignSelf: 'center',
        color: '#FFFFFF'
    },
    enableInfoWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    tab: {
        alignItems: 'center',
        flex: 0.5,
        height: 56,
        justifyContent: 'center',
        borderBottomWidth: 6,
        borderColor: 'transparent'
    },
    connectionInfoWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25
    },
    connectionInfo: {
        fontWeight: 'bold',
        alignSelf: 'center',
        fontSize: 18,
        marginVertical: 10,
        color: '#238923'
    },
    listContainer: {
        borderColor: '#ccc',
        borderTopWidth: 0.5
    },
    listItem: {
        flex: 1,
        height: 48,
        paddingHorizontal: 16,
        borderColor: '#ccc',
        borderBottomWidth: 0.5,
        justifyContent: 'center'
    },
    fixedFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#ddd'
    },
    button: {
        height: 36,
        margin: 5,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        color: '#7B1FA2',
        fontWeight: 'bold',
        fontSize: 14
    },
    buttonRaised: {
        backgroundColor: '#7B1FA2',
        borderRadius: 2,
        elevation: 2
    }
})

