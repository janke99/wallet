import React from 'react';
import { connect } from 'react-redux'
import { Dimensions, DeviceEventEmitter, StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, } from 'react-native';
import ScreenUtil from '../../utils/ScreenUtil'
import UColor from '../../utils/Colors'
import Button from '../../components/Button'
import Ionicons from 'react-native-vector-icons/Ionicons'
import QRCode from 'react-native-qrcode-svg';
import { EasyToast } from '../../components/Toast';
import { EasyShowLD } from "../../components/EasyShow"
import BaseComponent from "../../components/BaseComponent";
import Constants from '../../utils/Constants';
import {NavigationActions} from 'react-navigation';
import JPushModule from 'jpush-react-native';
const ScreenWidth = Dimensions.get('window').width;
const ScreenHeight = Dimensions.get('window').height;
var AES = require("crypto-js/aes");
var CryptoJS = require("crypto-js");
var dismissKeyboard = require('dismissKeyboard');

@connect(({wallet, login }) => ({ ...wallet, ...login }))
class ActivationAt extends BaseComponent {
    static navigationOptions = ({ navigation }) => {
       
        return {                       
          headerTitle:'激活账户',
          headerStyle:{
                paddingTop: ScreenUtil.autoheight(20),
                backgroundColor: UColor.mainColor,
                borderBottomWidth:0,
            },
          headerRight: (<Button  onPress={navigation.state.params.onPress}>  
                <Text style={{color: UColor.arrow, fontSize: ScreenUtil.setSpText(18),justifyContent: 'flex-end',paddingRight:15}}>删除该账号</Text>
          </Button>),                  
        };
      };

      // 构造函数  
    constructor(props) { 
        super(props);
        this.props.navigation.setParams({ onPress: this.checkDeleteWallet });
        this.state = {
            cpu:"0.1",
            net:"0.1",
            ram:"1",
            name:"",
            password: "",
            ownerPk: '',
            activePk: '',
            ownerPublic: '',
            activePublic: '',
            show: false,
            Invalid: false,
        };
    }

     //组件加载完成
   componentDidMount() {
        var params = this.props.navigation.state.params.parameter;
        this.setState({
        name:  params.name,
        ownerPublic: params.ownerPublic,
        activePublic: params.activePublic
        });
    }

    componentWillUnmount(){
        var entry = this.props.navigation.state.params.entry;
        if(entry == "walletDetails"){
            this.pop(3, true);
        }else if(entry == "createWallet"){
            this.pop(3, true);
        }
        //结束页面前，资源释放操作
        super.componentWillUnmount();
    }

    pop(nPage, immediate) {
        const action = NavigationActions.pop({
            n: nPage,
            immediate: immediate,
        });
        this.props.navigation.dispatch(action);
    }

     //未激活账号直接删除
    checkDeleteWallet = () =>{
        const c = this.props.navigation.state.params.parameter;
      EasyShowLD.dialogShow("免责声明",  (<View>
        <Text style={{color: UColor.arrow,fontSize: ScreenUtil.setSpText(14),}}>删除过程中会检测您的账号是否已激活，如果您没有备份私钥，删除后将无法找回！请确保该账号不再使用后再删除！</Text>
        </View>),"下一步","返回钱包",  () => {
            EasyShowLD.dialogClose();
            EasyShowLD.loadingShow();
                //检测账号是否已经激活
            this.props.dispatch({
                type: "wallet/isExistAccountNameAndPublicKey", payload: {account_name: c.name, owner: c.ownerPublic, active: c.activePublic}, callback:(result) =>{
                    EasyShowLD.loadingClose();
                    if(result.code == 0 && result.data == true){
                        //msg:success,data:true, code:0 账号已存在
                        EasyShowLD.dialogShow("免责声明",  (<View>
                            <Text style={{color: UColor.arrow,fontSize: ScreenUtil.setSpText(14),}}>系统检测到该账号<Text style={{color: UColor.showy,fontSize: ScreenUtil.setSpText(15),}}>已经激活</Text>！如果执意删除请先导出私钥并保存好，否则删除后无法找回</Text>
                        </View>),"执意删除","返回钱包",  () => {
                            this.deleteWallet();
                            EasyShowLD.dialogClose()
                        }, () => { EasyShowLD.dialogClose() });
                    }else if(result.code == 521){
                        //msg:账号不存在,data:null,code:521
                        EasyShowLD.dialogShow("免责声明",  (<View>
                            <Text style={{color: UColor.arrow,fontSize: ScreenUtil.setSpText(14),}}>系统检测到该账号还没激活，如果您不打算激活此账号，建议删除。</Text>
                        </View>),"删除","取消",  () => {
                            this.deletionDirect();
                            EasyShowLD.dialogClose()
                        }, () => { EasyShowLD.dialogClose() });
                    }else if(result.code == 515){
                        //msg:账号不存在,data:null,code:521
                        EasyShowLD.dialogShow("免责声明",  (<View>
                        <Text style={{color: UColor.arrow,fontSize: ScreenUtil.setSpText(14),}}>系统检测到该账号已经被别人抢注，强烈建议删除。</Text>
                      </View>),"删除","取消",  () => {
                          this.deletionDirect();
                          EasyShowLD.dialogClose()
                      }, () => { EasyShowLD.dialogClose() });
                    }else {
                        EasyShowLD.dialogShow("免责声明",  (<View>
                            <Text style={{color: UColor.arrow,fontSize: ScreenUtil.setSpText(14),}}>网络异常, 暂不能检测到账号是否已经激活, 建议暂不删除此账号, 如果执意删除请先导出私钥并保存好，否则删除后无法找回。</Text>
                          </View>),"执意删除","取消",  () => {
                              this.deletionDirect();
                              EasyShowLD.dialogClose()
                          }, () => { EasyShowLD.dialogClose() });
                    }
                }
            })
        }, () => { EasyShowLD.dialogClose() });
    }

      //未激活账号直接删除
    deletionDirect() {
        EasyShowLD.dialogClose();
        var data = this.props.navigation.state.params.parameter;
        this.props.dispatch({ type: 'wallet/delWallet', payload: { data } });
        //删除tags
        JPushModule.deleteTags([data.name],map => {
        if (map.errorCode === 0) {
            console.log('Delete tags succeed, tags: ' + map.tags)
        } else {
            console.log(map)
            console.log('Delete tags failed, error code: ' + map.errorCode)
        }
        });
        DeviceEventEmitter.addListener('delete_wallet', (tab) => {
            // this.props.navigation.goBack();
            this.pop(2, true);

        });
    }

    //已激活账号需要验证密码
    deleteWallet() {
        EasyShowLD.dialogClose();
        const view =
        <View style={styles.passoutsource}>
            <TextInput autoFocus={true} onChangeText={(password) => this.setState({ password })} returnKeyType="go" 
            selectionColor={UColor.tintColor} secureTextEntry={true}  keyboardType="ascii-capable"  style={styles.inptpass} maxLength={Constants.PWD_MAX_LENGTH}
            placeholderTextColor={UColor.arrow}  placeholder="请输入密码"  underlineColorAndroid="transparent" />
        </View>
        EasyShowLD.dialogShow("密码", view, "确定", "取消", () => {
        if (this.state.password == "" || this.state.password.length < Constants.PWD_MIN_LENGTH) {
            EasyToast.show('密码长度至少4位,请重输');
            return;
        }
        try {
            var data = this.props.navigation.state.params.parameter;
            var ownerPrivateKey = this.props.navigation.state.params.data.ownerPrivate;
            var bytes_words = CryptoJS.AES.decrypt(ownerPrivateKey.toString(), this.state.password + this.props.navigation.state.params.data.salt);
            var plaintext_words = bytes_words.toString(CryptoJS.enc.Utf8);
            if (plaintext_words.indexOf('eostoken') != - 1) {
            plaintext_words = plaintext_words.substr(8, plaintext_words.length);
            const { dispatch } = this.props;
            this.props.dispatch({ type: 'wallet/delWallet', payload: { data }, callback: () => {
                //删除tags
                JPushModule.deleteTags([data.name],map => {
                    if (map.errorCode === 0) {
                    console.log('Delete tags succeed, tags: ' + map.tags)
                    } else {
                    console.log(map)
                    console.log('Delete tags failed, error code: ' + map.errorCode)
                    }
                });
                // this.props.navigation.goBack();
                this.pop(2, true);

            } });

            // DeviceEventEmitter.addListener('delete_wallet', (tab) => {
            //     this.props.navigation.goBack();
            // });
            } else {
            EasyToast.show('您输入的密码不正确');
            }
        } catch (error) {
            EasyToast.show('您输入的密码不正确');
        }
        // EasyShowLD.dialogClose();
        }, () => { EasyShowLD.dialogClose() });
    }
        
    dismissKeyboardClick() {
        dismissKeyboard();
    }

    _onPressListItem() {
        this.setState((previousState) => {
            return ({
            Invalid: !previousState.Invalid,
            })
        });
    }

    getQRCode() { 
        // this.state.name == "" || this.state.ownerPublic == "" || this.state.activePublic == ""
        if(this.state.name == null || this.state.ownerPublic == null || this.state.activePublic == null ){
            EasyToast.show("生成二维码失败：公钥错误!");
            return;
        }
        // var  qrcode='activeWallet:' + this.state.name + '?owner=' + this.state.ownerPublic +'&active=' + this.state.activePublic+'&cpu=' + this.state.cpu +'&net=' + this.state.net +'&ram=' + this.state.ram;
        var  qrcode= '{"action":"' + 'activeWallet'  + '","account":"' + this.state.name + '","owner":"' + this.state.ownerPublic + '","active":"' + this.state.activePublic  + '","cpu":"' + this.state.cpu  + '","net":"' + this.state.net  + '","ram":"' + this.state.ram + '"}';
        return qrcode;
    }

    checkAccountActive(){
        const wallet = this.props.navigation.state.params.parameter;
        var name = wallet.name;
        var owner = wallet.ownerPublic;
        var active = wallet.activePublic
    
        try {
            //检测账号是否已经激活
            // EasyShowLD.dialogClose();
            EasyShowLD.loadingShow();
            this.props.dispatch({
                type: "wallet/isExistAccountNameAndPublicKey", payload: {account_name: name, owner: owner, active: active}, callback:(result) =>{
                    EasyShowLD.loadingClose();
                    if(result.code == 0 && result.data == true){
                        wallet.isactived = true
                        this.props.dispatch({type: 'wallet/activeWallet', wallet: wallet});
                        //msg:success,data:true, code:0 账号已存在
                        EasyShowLD.dialogShow("恭喜激活成功", (<View>
                            <Text style={{fontSize: ScreenUtil.setSpText(20), color: UColor.showy, textAlign: 'center',}}>{name}</Text>
                            {/* <Text style={styles.inptpasstext}>您申请的账号已经被***激活成功</Text> */}
                        </View>), "知道了", null,  () => { EasyShowLD.dialogClose() });
                    }else if(result.code == 521){
                        //msg:账号不存在,data:null,code:521
                        EasyToast.show("账户还未成功激活！请确认支付后再次尝试！");
                    }else if(result.code == 515) {
                        EasyToast.show("抱歉，该账户已经被抢注，请删除该账户，重新换个账户激活吧!");
                    }else {
                        // 未知异
                        EasyToast.show("网络异常, 暂不能检测到账号是否已经激活, 请重试！");
                    }
                }
            });
        } catch (error) {
            EasyShowLD.loadingClose();
        }
    }

    contactWeChataide() {
        const { navigate } = this.props.navigation;
        navigate('AssistantQrcode', {});
    }

    onShareFriend() {
        DeviceEventEmitter.emit('Activation','{"account_name":"' + this.state.name + '","owner":"' + this.state.ownerPublic + '","active":"' + this.state.activePublic + '","cpu":"' + this.state.cpu + '","net":"' + this.state.net + '","ram":"'+ this.state.ram +'"}');
    }

    render() {
        return (<View style={styles.container}>
        <ScrollView keyboardShouldPersistTaps="always">
            <TouchableOpacity activeOpacity={1.0} onPress={this.dismissKeyboardClick.bind(this)}>
                <View style={styles.header}>
                    <View style={styles.inptoutbg}>
                        <View style={styles.headout}>
                            <Text style={styles.inptitle}>重要说明：</Text>
                            <Text style={styles.headtitle}>激活EOS主网账户需要消耗EOS，支付完成后将激活该账户.目前激活EOS账户最低内存约需1.5EOS</Text>
                        </View>  
                        <View style={styles.inptoutgo} >
                            <TouchableOpacity onPress={() => this._onPressListItem()}>
                                <View style={styles.ionicout}>
                                    <Text style={styles.prompttext}>您的EOS账户信息如下</Text>
                                    <Ionicons name={this.state.Invalid ? "ios-arrow-down-outline" : "ios-arrow-forward-outline"} size={14} color={UColor.tintColor}/>
                                </View>
                            </TouchableOpacity>
                            {this.state.Invalid&&
                            <View style={styles.inptgo}>
                                <Text style={styles.headtitle}>账户名称：{this.state.name}</Text>
                                <Text style={styles.headtitle}>Active公钥：{this.state.activePublic}</Text>
                                <Text style={styles.headtitle}>Owner公钥：{this.state.ownerPublic}</Text>
                            </View>}
                        </View>
                        <View style={styles.headout}>
                            <Text style={styles.inptitle}>扫码激活说明</Text>
                            <Text style={styles.headtitle}>用另一个有效的EOS账号自助激活或请求朋友帮助您支付激活，还可以联系官方小助手付费激活。</Text>
                        </View>
                        <View style={styles.codeout}>
                            <View style={styles.qrcode}>
                               <QRCode size={ScreenUtil.setSpText(120)}  value = {this.getQRCode()} />
                            </View>
                        </View> 
                    </View> 
                    <Button onPress={() => this.contactWeChataide()}>
                        <View style={styles.importPriout}>
                            <Text style={styles.importPritext}>联系官方小助手激活</Text>
                        </View>
                    </Button>
                    <Button onPress={() => this.onShareFriend()}>
                        <View style={styles.importPriout}>
                            <Text style={styles.importPritext}>请朋友协助激活</Text>
                        </View>
                    </Button>
                    <Button onPress={() => this.checkAccountActive()}>
                        <View style={styles.importPriout}>
                            <Text style={styles.importPritext}>激活（已支付完成）</Text>
                        </View>
                    </Button>
                </View>
            </TouchableOpacity>
         </ScrollView> 
     </View>)
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: UColor.mainColor,
    },
    header: {
        borderTopWidth: ScreenUtil.autowidth(10),
        borderTopColor: UColor.secdColor,
        backgroundColor: UColor.mainColor,
    },
    inptoutbg: {
        backgroundColor: UColor.mainColor,
        paddingHorizontal: ScreenUtil.autowidth(20),
    },
    headout: {
        paddingTop: ScreenUtil.autoheight(10),
    },
    inptoutgo: {
        backgroundColor: UColor.mainColor,
    },
    ionicout: {
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    prompttext: {
        fontSize: ScreenUtil.setSpText(15),
        color: UColor.tintColor,
        marginVertical: ScreenUtil.autoheight(5),
        marginRight: ScreenUtil.autowidth(10),
    },
    inptitle: {
        flex: 1,
        fontSize: ScreenUtil.setSpText(15),
        lineHeight: ScreenUtil.autoheight(30),
        color: UColor.fontColor,
    },
    inptgo: {
        paddingHorizontal: ScreenUtil.autowidth(20),
        paddingTop: ScreenUtil.autoheight(15),
        backgroundColor: UColor.secdColor,
    },
    headtitle: {
        color: UColor.arrow,
        fontSize: ScreenUtil.setSpText(14),
        lineHeight: ScreenUtil.autoheight(25),
        marginBottom: ScreenUtil.autoheight(10),
    },

    codeout: {
        flex: 1,
        marginBottom: ScreenUtil.autoheight(20),
        alignItems: "center",
        justifyContent: "center",
        alignItems: "center",
    },
    qrcode: {
        backgroundColor: UColor.fontColor,
        padding: ScreenUtil.autowidth(5),
    },

    importPriout: {
        height: ScreenUtil.autoheight(45),
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: ScreenUtil.autowidth(20),
        marginBottom: ScreenUtil.autoheight(15),
        borderRadius: 5,
        backgroundColor:  UColor.tintColor,
    },
    importPritext: {
        fontSize: ScreenUtil.setSpText(15),
        color: UColor.fontColor,
    },

});
export default ActivationAt;