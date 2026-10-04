import React, {useEffect, useState} from "react";
import {Alert, ActivityIndicator, FlatList, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://YOUR-API-DOMAIN.example.com";

async function api(path, options = {}) {
  const token = await AsyncStorage.getItem("ardy_token");
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? {Authorization: `Bearer ${token}`} : {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "حدث خطأ في الاتصال");
  return data;
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  async function load() {
    try {
      const [p, pf, d] = await Promise.all([
        api("/projects"),
        api("/portfolio"),
        api("/documents")
      ]);
      setProjects(p.projects || []);
      setPortfolio(pf);
      setDocuments(d.documents || []);
    } catch (e) {
      // Login is required for private endpoints; keep app usable as a public demo.
      try {
        const p = await api("/projects");
        setProjects(p.projects || []);
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function login() {
    if (!phone || !name) return Alert.alert("بيانات ناقصة", "اكتب الاسم ورقم الهاتف");
    try {
      const data = await api("/auth/demo-login", {
        method: "POST",
        body: JSON.stringify({phone, name})
      });
      await AsyncStorage.setItem("ardy_token", data.token);
      setLoginOpen(false);
      setName("");
      setPhone("");
      setLoading(true);
      await load();
    } catch (e) {
      Alert.alert("تعذر تسجيل الدخول", e.message);
    }
  }

  async function invest(project) {
    if (!portfolio) {
      setLoginOpen(true);
      return;
    }
    Alert.prompt?.(
      "شراء وحدات",
      `سعر الوحدة: ${Number(project.unitPrice).toFixed(2)} جنيه`,
      async (value) => {
        const units = Number(value);
        if (!Number.isInteger(units) || units <= 0) return;
        try {
          await api("/investments", {
            method: "POST",
            body: JSON.stringify({projectId: project.id, units})
          });
          Alert.alert("تم", "تم إرسال طلب الاستثمار للمراجعة.");
          load();
        } catch (e) {
          Alert.alert("تعذر تنفيذ الطلب", e.message);
        }
      },
      "plain-text"
    );
  }

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large"/><Text style={styles.muted}>جاري التحميل...</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.brand}>أرضي</Text>
        <Pressable onPress={() => setLoginOpen(true)}><Text style={styles.login}>تسجيل الدخول</Text></Pressable>
      </View>

      {screen === "home" && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>استثمر في الزراعة بشكل منظم</Text>
            <Text style={styles.heroText}>مشروعات زراعية موثقة، وحدات استثمارية، ومتابعة واضحة من داخل التطبيق.</Text>
          </View>
          <Text style={styles.section}>المشروعات المتاحة</Text>
          {projects.map(p => (
            <Pressable key={p.id} style={styles.card} onPress={() => setSelected(p)}>
              <Text style={styles.cardTitle}>{p.name}</Text>
              <Text style={styles.muted}>{p.feddans} فدان • {p.status}</Text>
              <Text style={styles.price}>{Number(p.unitPrice).toFixed(2)} جنيه / وحدة</Text>
              <Pressable style={styles.button} onPress={() => invest(p)}>
                <Text style={styles.buttonText}>استعرض واستثمر</Text>
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {screen === "portfolio" && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.section}>محفظتي</Text>
          {!portfolio ? <Text style={styles.muted}>سجل الدخول لعرض محفظتك.</Text> :
            <>
              <View style={styles.stat}><Text>إجمالي الاستثمارات</Text><Text style={styles.bold}>{Number(portfolio.totalInvested || 0).toFixed(2)} جنيه</Text></View>
              <View style={styles.stat}><Text>عدد الوحدات</Text><Text style={styles.bold}>{portfolio.totalUnits || 0}</Text></View>
            </>
          }
        </ScrollView>
      )}

      {screen === "documents" && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.section}>المستندات</Text>
          {documents.length ? documents.map(d => <View style={styles.card} key={d.id}><Text style={styles.bold}>{d.title}</Text><Text style={styles.muted}>{d.type}</Text></View>) : <Text style={styles.muted}>لا توجد مستندات متاحة.</Text>}
        </ScrollView>
      )}

      {screen === "profile" && (
        <View style={styles.content}>
          <Text style={styles.section}>حسابي</Text>
          <Pressable style={styles.button} onPress={() => setLoginOpen(true)}><Text style={styles.buttonText}>تسجيل الدخول / إنشاء الحساب</Text></Pressable>
        </View>
      )}

      <View style={styles.nav}>
        {[
          ["home","الرئيسية"],["portfolio","المحفظة"],["documents","المستندات"],["profile","حسابي"]
        ].map(([id,label]) => <Pressable key={id} onPress={() => setScreen(id)}><Text style={[styles.navText, screen===id && styles.navActive]}>{label}</Text></Pressable>)}
      </View>

      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.section}>{selected?.name}</Text>
            <Text style={styles.muted}>{selected?.feddans} فدان</Text>
            <Text style={styles.body}>سعر الوحدة: {Number(selected?.unitPrice || 0).toFixed(2)} جنيه</Text>
            <Text style={styles.body}>حالة المشروع: {selected?.status}</Text>
            <Pressable style={styles.button} onPress={() => { const p=selected; setSelected(null); invest(p); }}><Text style={styles.buttonText}>استثمار</Text></Pressable>
            <Pressable onPress={() => setSelected(null)}><Text style={styles.close}>إغلاق</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={loginOpen} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.section}>تسجيل الدخول</Text>
            <TextInput style={styles.input} placeholder="الاسم" value={name} onChangeText={setName}/>
            <TextInput style={styles.input} placeholder="رقم الهاتف" keyboardType="phone-pad" value={phone} onChangeText={setPhone}/>
            <Pressable style={styles.button} onPress={login}><Text style={styles.buttonText}>متابعة</Text></Pressable>
            <Pressable onPress={() => setLoginOpen(false)}><Text style={styles.close}>إلغاء</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#f7f8fa"},
  center:{flex:1,alignItems:"center",justifyContent:"center"},
  header:{height:64,paddingHorizontal:18,flexDirection:"row-reverse",alignItems:"center",justifyContent:"space-between",backgroundColor:"#fff",borderBottomWidth:1,borderBottomColor:"#eee"},
  brand:{fontSize:24,fontWeight:"800"},
  login:{fontWeight:"700"},
  content:{padding:16,paddingBottom:100},
  hero:{backgroundColor:"#fff",borderRadius:18,padding:20,marginBottom:18},
  heroTitle:{fontSize:25,fontWeight:"800",textAlign:"right",marginBottom:8},
  heroText:{fontSize:15,lineHeight:24,textAlign:"right"},
  section:{fontSize:21,fontWeight:"800",textAlign:"right",marginBottom:12},
  card:{backgroundColor:"#fff",borderRadius:16,padding:16,marginBottom:12},
  cardTitle:{fontSize:18,fontWeight:"800",textAlign:"right"},
  muted:{color:"#70757d",marginTop:6,textAlign:"right"},
  price:{fontSize:17,fontWeight:"800",marginTop:10,textAlign:"right"},
  button:{backgroundColor:"#111",padding:13,borderRadius:12,marginTop:14,alignItems:"center"},
  buttonText:{color:"#fff",fontWeight:"800"},
  nav:{position:"absolute",bottom:0,left:0,right:0,height:70,backgroundColor:"#fff",flexDirection:"row-reverse",justifyContent:"space-around",alignItems:"center",borderTopWidth:1,borderTopColor:"#eee"},
  navText:{fontSize:12,color:"#777",fontWeight:"700"},
  navActive:{color:"#111"},
  stat:{backgroundColor:"#fff",borderRadius:15,padding:18,marginBottom:10,flexDirection:"row-reverse",justifyContent:"space-between"},
  bold:{fontWeight:"800"},
  body:{fontSize:16,lineHeight:26,textAlign:"right",marginTop:8},
  overlay:{flex:1,backgroundColor:"rgba(0,0,0,.45)",justifyContent:"flex-end"},
  modal:{backgroundColor:"#fff",padding:20,borderTopLeftRadius:24,borderTopRightRadius:24,minHeight:300},
  input:{backgroundColor:"#f3f4f6",padding:14,borderRadius:12,marginTop:10,textAlign:"right"},
  close:{textAlign:"center",padding:16,fontWeight:"700"}
});
