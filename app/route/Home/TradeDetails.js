import React from 'react';
import { connect } from 'react-redux'
import { StyleSheet, View, Text, Image, Clipboard, Linking} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import UColor from '../../utils/Colors'
import Button from  '../../components/Button'
import UImage from '../../utils/Img'
import ViewShot from "react-native-view-shot";
import ScreenUtil from '../../utils/ScreenUtil'
import { EasyToast } from '../../components/Toast';
import { EasyShowLD } from '../../components/EasyShow'
import BaseComponent from "../../components/BaseComponent";
import moment from 'moment';
var WeChat = require('react-native-wechat');

const UrlHead = "https://eoseco.com/search?q=";
@connect(({login}) => ({...login}))
class TradeDetails extends BaseComponent {
    static navigationOptions = ({ navigation }) => {
        const params = navigation.state.params || {};
        return {
            headerTitle: '交易详情',
            headerStyle: {
                paddingTop: ScreenUtil.autoheight(20),
                backgroundColor: UColor.mainColor,
                borderBottomWidth:0,
            },
            headerRight: (<Button name="search" onPress={navigation.state.params.onPress}>
            <View style={{ padding: ScreenUtil.autowidth(15) }}>
            <Image source={UImage.share_i} style={{ width: ScreenUtil.autowidth(22), height: ScreenUtil.autowidth(22) }}></Image>
            </View>
          </Button>),   
        };
    };

  constructor(props) {
    super(props);
    var paramtrade = new Object();

    if(this.props.navigation.state.params.trade){
      paramtrade = this.props.navigation.state.params.trade;
      paramtrade.disptype = 0;
    }else if(this.props.navigation.state.params.transaction){
      paramtrade.disptype = 1;
      paramtrade.type = this.props.navigation.state.params.transaction.action_name;
      paramtrade.quantity = this.props.navigation.state.params.transaction.eos_qty;
      paramtrade.code = "";
      paramtrade.description = "";
      paramtrade.bytes = "";
      paramtrade.memo = "";
      paramtrade.blockTime = this.props.navigation.state.params.transaction.record_date;
      paramtrade.transactionId = this.props.navigation.state.params.transaction.trx_id;
      paramtrade.from = this.props.navigation.state.params.transaction.account;
      paramtrade.to = "";
      paramtrade.blockNum = this.props.navigation.state.params.transaction.block_num;

    }else if(this.props.navigation.state.params.ramtransaction){
      paramtrade.disptype = 2;
      paramtrade.type = this.props.navigation.state.params.ramtransaction.action_name;
      paramtrade.quantity = this.props.navigation.state.params.ramtransaction.eos_qty;
      paramtrade.code = "";
      paramtrade.description = "";
      paramtrade.bytes = "";
      paramtrade.memo = "";
      paramtrade.blockTime = this.props.navigation.state.params.ramtransaction.record_date;
      paramtrade.transactionId = this.props.navigation.state.params.ramtransaction.trx_id;
      paramtrade.from = this.props.navigation.state.params.ramtransaction.payer;
      paramtrade.to = this.props.navigation.state.params.ramtransaction.receiver;
      paramtrade.blockNum = this.props.navigation.state.params.ramtransaction.block_num;  
    }
    else{
      //防止出错，正常情况，不应该到这里
      paramtrade.disptype = 0;
      paramtrade.type = "";
      paramtrade.quantity = "";
      paramtrade.code = "";
      paramtrade.description = "";
      paramtrade.bytes = "";
      paramtrade.memo = "";
      paramtrade.blockTime = "";
      paramtrade.transactionId = "";
      paramtrade.from = "";
      paramtrade.to = "";
      paramtrade.blockNum = 0;  
    }

    WeChat.registerApp('wxc5eefa670a40cc46');
    this.props.navigation.setParams({ onPress: this._rightTopClick });
    this.state = {
       trade: paramtrade,
    };
  }

  _rightTopClick = () =>{
    this.refs.viewShot.capture().then(uri => {
      WeChat.isWXAppInstalled().then((isInstalled) => {
          EasyShowLD.dialogClose();
          if (isInstalled) {
            WeChat.shareToSession({ type: 'imageFile', imageUrl: uri })
              .catch((error) => {
                EasyToast.show(error.message);
              });
          } else {
            EasyToast.show('没有安装微信软件，请您安装微信之后再试');
          }
        });
    });
  }


  componentDidMount() {
        //alert('trade: '+JSON.stringify(this.props.navigation.state.params.trade));
  }
  componentWillUnmount(){
    //结束页面前，资源释放操作
    super.componentWillUnmount();
    
  }
  prot(key, data = {}) {
    if (key == 'transactionId') {
      // Linking.openURL(UrlHead + 'tx/' + this.state.trade.transactionId);
      Linking.openURL(UrlHead + this.state.trade.transactionId);
    }else  if (key == 'from') {
      // Linking.openURL(UrlHead + 'account/' + this.state.trade.from);
      Linking.openURL(UrlHead + this.state.trade.from);
    }else  if (key == 'to') {
      // Linking.openURL(UrlHead  + 'account/' + this.state.trade.to);
      Linking.openURL(UrlHead + this.state.trade.to);
    }else  if (key == 'blockNum') {
      if(this.state.trade.blockNum == null || this.state.trade.blockNum == ""){
        return;
      }
      // Linking.openURL(UrlHead  + 'block/' + this.state.trade.blockNum);
      Linking.openURL(UrlHead + this.state.trade.blockNum);
    }
  }




  copy = (trade) => {
    // Clipboard.setString( UrlHead + 'tx/' + trade.transactionId);
    Clipboard.setString( UrlHead + trade.transactionId);
    EasyToast.show("复制成功");
  }
  
  render() {
    // const c = this.props.navigation.state.params.trade;
    return <View style={styles.container}>
      <ViewShot ref="viewShot" style={{flex: 1,backgroundColor:UColor.secdColor}}> 
        {this.state.trade.disptype == 0 && <View style={styles.header}>
            <View style={styles.headout}>
                <Text style={styles.quantitytext}>{this.state.trade.type=='转出'?'-':'+'} </Text>
                <Text style={styles.quantitytext}>{this.state.trade.quantity.replace(this.state.trade.code, "")} </Text>
                <Text style={styles.headtext}> {this.state.trade.code}</Text>
            </View>
            <Text style={styles.description}>({this.state.trade.description}{this.state.trade.bytes? this.state.trade.bytes + " bytes":""})</Text>
          </View>
        }
        {this.state.trade.disptype == 1 && <View style={styles.header}>
            <View style={styles.headout}>
                {/* <Text style={styles.quantitytext}>{transaction.action_name == 'selltoken'?'+':'-'} </Text> */}
                <Text style={styles.quantitytext}>{this.state.trade.quantity}</Text>
                {/* <Text style={styles.headtext}> {transaction.eos_qty}</Text> */}
            </View>
            <Text style={styles.description}>{this.state.trade.type == 'selltoken'?'(卖)':'(买)'}</Text>
          </View>
        }
        {this.state.trade.disptype == 2 && <View style={styles.header}>
            <View style={styles.headout}>
                {/* <Text style={styles.quantitytext}>{c.type=='转出'?'-':'+'} </Text> */}
                <Text style={styles.quantitytext}>{this.state.trade.quantity} </Text>
                {/* <Text style={styles.headtext}> {c.code}</Text> */}
            </View>
            <Text style={styles.description}>{this.state.trade.type == 'buyram'?'(买)':'(卖)'}</Text>
          </View>
        }
        <View style={{flexDirection: "row", borderBottomColor: UColor.mainColor, borderBottomWidth: 0.5,paddingHorizontal: ScreenUtil.autowidth(10),paddingVertical: ScreenUtil.autoheight(20),}}>
          <View style={styles.conout}>
            <View style={styles.conouttext}>
              <Text style={styles.context}>发  送  方: </Text> 
              <Text style={styles.tintext} onPress={this.prot.bind(this, 'from')}>{this.state.trade.from}</Text>
            </View>
            <View style={styles.conouttext}>
              <Text style={styles.context}>接  受  方: </Text>
              <Text style={styles.tintext} onPress={this.prot.bind(this, 'to')}>{this.state.trade.to}</Text>
            </View>
            <View style={styles.conouttext}> 
              <Text style={styles.context}>区块高度: </Text>
              {(this.state.trade.blockNum == null || this.state.trade.blockNum == "") ? 
              <Text style={styles.showytext}>未确认</Text>:
              <Text style={styles.tintext} onPress={this.prot.bind(this, 'blockNum')}>{this.state.trade.blockNum}</Text>
              }
            </View>
            <View style={styles.conouttext}>
              <Text style={styles.context}> 备     注  : </Text>
              <Text style={styles.blocktext} numberOfLines={8} ellipsizeMode='tail'>{this.state.trade.memo}</Text>
            </View>
          </View>
          <View style={styles.codeout}>
            <View style={styles.qrcode}>
               <QRCode size={ScreenUtil.setSpText(90)} value={UrlHead + this.state.trade.transactionId } />
            </View>
            <Button onPress={this.copy.bind(this,this.state.trade)}>
               <View style={{backgroundColor: UColor.mainColor,borderRadius: 25,}}>
                 <Text style={{ fontSize: ScreenUtil.setSpText(12),color: UColor.arrow,paddingHorizontal: ScreenUtil.autowidth(10),paddingVertical: ScreenUtil.autoheight(2),}}>复制URL</Text>
               </View>
            </Button>
          </View>
        </View>
        <View style={styles.tradehint}>
          <View style={styles.conouttext}>
            <Text style={styles.contwotext}>交  易  号: </Text>
            <Text style={styles.tintext} onPress={this.prot.bind(this, 'transactionId')}>{this.state.trade.transactionId.substring(0, 10) +"..."+ this.state.trade.transactionId.substr(this.state.trade.transactionId.length-10) }</Text>
          </View>
          <View style={styles.conouttext}>
            <Text style={styles.contwotext}> 提     示  : </Text>
            <Text style={styles.blocktext}>扫码可获取区块交易状态</Text>
          </View>
          <View style={styles.conouttext}>
            <Text style={styles.contwotext}>交易时间: </Text>
            <Text style={styles.blocktext}>{moment(this.state.trade.blockTime).add(8,'hours').format('YYYY/MM/DD HH:mm')}</Text>
          </View>
        </View>
        <View style={styles.logout}>
            <Image source={UImage.bottom_log} style={styles.logimg}/>
            <Text style={styles.logtext}>EosToken 专注柚子生态</Text>
        </View>
      </ViewShot>
    </View>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection:'column',
    backgroundColor: UColor.secdColor,
  },
 
  header: {
    height: ScreenUtil.autoheight(100),
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomColor: UColor.mainColor,
    borderBottomWidth: 0.5,
  },
  headout: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantitytext: {
    fontSize: ScreenUtil.setSpText(30),
    color: UColor.fontColor
  },
  headtext: {
    fontSize: ScreenUtil.setSpText(15),
    color: UColor.arrow,
    paddingTop: ScreenUtil.autoheight(10),
  },
  description: {
    height: ScreenUtil.autoheight(35),
    fontSize: ScreenUtil.setSpText(14),
    color: UColor.tintColor,
  },
  conout: {
    flex: 2,
    flexDirection: "column",
  },
  conouttext: {
    flexDirection: "row",
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: ScreenUtil.autoheight(10),
  },
  context: {
    flex: 2,
    paddingRight: ScreenUtil.autowidth(5),
    textAlign: 'right',
    fontSize: ScreenUtil.setSpText(14),
    color: UColor.arrow,
  },
  contwotext: {
    flex: 1,
    paddingRight: ScreenUtil.autowidth(5),
    textAlign: 'right',
    fontSize: ScreenUtil.setSpText(14),
    color: UColor.arrow,
  },

  tradehint: {
    flex: 1,
    paddingHorizontal: ScreenUtil.autowidth(10),
    marginTop: ScreenUtil.autoheight(40),
  },
  blocktext: {
    color: UColor.arrow, 
    flex: 4,
    paddingLeft: ScreenUtil.autowidth(5),
    fontSize: ScreenUtil.setSpText(14),
  },
  showytext: {
    color: UColor.showy, 
    flex: 4,
    fontSize: ScreenUtil.setSpText(14),
  },
  tintext: {
    color: UColor.tintColor, 
    flex: 4,
    paddingLeft: ScreenUtil.autowidth(5),
    fontSize: ScreenUtil.setSpText(14),
  },
  codeout: {
    flex:1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: "column",
  },
  qrcode: {
    backgroundColor: UColor.fontColor,
    paddingHorizontal:ScreenUtil.autowidth(5),
    paddingVertical: ScreenUtil.autowidth(5),
    marginBottom: ScreenUtil.autoheight(10),
  },
  logout:{
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: ScreenUtil.autoheight(20),
  },
  logimg: {
    width: ScreenUtil.autowidth(50), 
    height: ScreenUtil.autowidth(50)
  },
  logtext: {
    fontSize: ScreenUtil.setSpText(14),
    color: UColor.arrow,
    lineHeight: ScreenUtil.autoheight(30),
  }
});

export default TradeDetails;