---
name: secs-gem-open-source-docs
description: HSMS/SECS/GEM knowledge combining ReadTheDocs + GitHub codebase. Use for building simulators, handlers, SxFy patterns, and Cross-language open-source SECS/GEM implementations (Python/Java/.NET/Go) for protocol engineering
---

# Secs-Gem-Open-Source-Docs

HSMS/SECS/GEM knowledge combining ReadTheDocs + GitHub codebase. Use for building simulators, handlers, SxFy patterns, and cross-language open-source SECS/GEM implementations (Python/Java/.NET/Go) for protocol engineering.

## 💡 When to Use This Skill

Use this skill when you need to:

**Protocol Implementation:**
- Implement SECS-II (SEMI-E5) message formatting and data items
- Build HSMS (SEMI-E37) or HSMS-SS (SEMI-E37.1) communication layers
- Create semiconductor equipment interfaces following SEMI standards

**Message Operations:**
- Parse or generate SML (SECS Message Language) format
- Handle SxFy message patterns (S1F1, S1F2, S7F26, etc.)
- Work with SECS-II data types (ASCII, Binary, Boolean, Float, Int, Uint, List)

**System Development:**
- Build equipment simulators for testing
- Develop host/equipment communication software
- Implement active or passive HSMS connection modes
- Create message handlers for specific stream/function codes

**Cross-Language Projects:**
- Compare implementations across Python (secsgem), Java (secs4j), .NET (secs4net), Go (go-secs)
- Port code between different language ecosystems
- Understand protocol patterns across implementations

**Troubleshooting:**
- Debug HSMS connection issues (session management, state transitions)
- Resolve message encoding/decoding problems
- Check known issues across multiple implementations

## 🔑 Key Concepts

### SECS/GEM Protocol Basics
- **SECS-II**: Defines message structure, data items, and stream/function codes for semiconductor equipment communication
- **HSMS**: High-Speed SECS Message Services - TCP/IP-based transport layer for SECS-II messages
- **HSMS-SS**: Single Session variant of HSMS, simplified for single-connection scenarios
- **GEM**: Generic Equipment Model - standard behavior model built on top of SECS-II

### Message Components
- **Stream/Function (SxFy)**: Message identifier (e.g., S1F1 = Are You There request)
- **W-bit**: Wait bit indicating if reply is expected
- **Data Item**: Payload using typed format codes (ASCII, Integer, List, etc.)
- **System Bytes**: Unique identifier for message tracking and matching replies

### Connection Modes
- **Active Mode**: Client initiates TCP connection (typical for Host)
- **Passive Mode**: Server accepts connections (typical for Equipment)
- **Host Role**: System sending primary commands
- **Equipment Role**: Device responding to commands

### SML (SECS Message Language)
Text representation of SECS-II messages for readability and testing:
```
'S1F1' W <A "Equipment Name">.
```

## 🚀 Quick Reference

### 1. Creating Basic SECS-II Data Items (Go)

```go
// Using explicit constructors
asciiItem := secs2.NewASCIIItem("Equipment123")
intItem := secs2.NewIntItem(4, 1, 2, 3, 4)  // I4/int32
floatItem := secs2.NewFloatItem(8, 3.14, 2.71)  // F8/float64

// Using shortcut functions (preferred)
ascii := secs2.A("Equipment123")
integers := secs2.I4(1, 2, 3, 4)
floats := secs2.F8(3.14, 2.71)
binary := secs2.B(0x01, 0xFF, 0xAB)
```

### 2. Creating Nested List Structures (Go)

```go
// Build hierarchical message structure
message := secs2.L(
    secs2.A("PARAM_NAME"),
    secs2.U4(256),
    secs2.L(  // Nested list
        secs2.A("VALUE1"),
        secs2.A("VALUE2"),
    ),
)

// Access nested items
item, err := message.Get(2, 0)  // Gets "VALUE1"
if item.IsASCII() {
    str, _ := item.ToASCII()  // "VALUE1"
}
```

### 3. Parsing SML to HSMS Messages (Go)

```go
sml := `'S1F13' W
<L[2]
    <U4[1] 100>
    <L[2]
        <U4[1] 1001>
        <A "PARAM_VALUE">
    >
>.`

msgs, err := sml.ParseHSMS(sml)
if err != nil {
    log.Fatal(err)
}

msg := msgs[0]
// msg.StreamCode() == 1
// msg.FunctionCode() == 13
// msg.WaitBit() == true
```

### 4. Creating Data Message Handler (Go)

```go
func messageHandler(msg *hsms.DataMessage, session hsms.Session) {
    switch msg.StreamCode() {
    case 1:
        switch msg.FunctionCode() {
        case 1:  // S1F1 - Are You There
            reply := secs2.L(
                secs2.A("MyEquipment"),
                secs2.A("1.0.0"),
            )
            session.ReplyDataMessage(msg, reply)
        }
    case 6:
        switch msg.FunctionCode() {
        case 11:  // S6F11 - Event Report
            // Process event
            session.ReplyDataMessage(msg, secs2.B(0))
        }
    }
}
```

### 5. HSMS-SS Host Active Connection (Go)

```go
// Configure active connection (Host initiates)
connCfg := hsmsss.NewConnectionConfig(
    "192.168.1.100", 5000,
    WithActive(),
    WithHostRole(),
    WithT3Timeout(30*time.Second),
)

conn, _ := hsmsss.NewConnection(ctx, connCfg)
defer conn.Close()

session := conn.AddSession(0)
session.AddDataMessageHandler(messageHandler)

// Open and wait for SELECTED state
conn.Open(true)

// Send message with reply expected
reply, err := session.SendDataMessage(
    1, 1, true,  // S1F1 with W-bit
    secs2.A(""),
)
```

### 6. HSMS-SS Equipment Passive Connection (Go)

```go
// Configure passive connection (Equipment listens)
connCfg := hsmsss.NewConnectionConfig(
    "0.0.0.0", 5000,
    WithPassive(),
    WithEquipRole(),
    WithT3Timeout(30*time.Second),
)

conn, _ := hsmsss.NewConnection(ctx, connCfg)
defer conn.Close()

session := conn.AddSession(0)
session.AddDataMessageHandler(messageHandler)

// Listen and accept connections
conn.Open(true)
```

### 7. Python secsgem Basic Usage

```python
import secsgem

# Create SECS item
item = secsgem.SecsVarList([
    secsgem.SecsVarU4(100),
    secsgem.SecsVarString("VALUE")
])

# Send S1F1 message
s1f1 = secsgem.SecsS01F01()
response = connection.send_and_waitfor_response(s1f1)
```

### 8. Configuring SML Format Options (Go)

```go
// Stream/Function format options
hsms.UseStreamFunctionSingleQuote()  // 'S1F1'
hsms.UseStreamFunctionDoubleQuote()  // "S1F1"
hsms.UseStreamFunctionNoQuote()      // S1F1

// ASCII item quote style
secs2.UseASCIIDoubleQuote()  // <A "text">
secs2.UseASCIISingleQuote()  // <A 'text'>

// Generate SML from message
smlString := dataMessage.ToSML()
```

### 9. Checking Data Item Types (Go)

```go
item := message.Get(0)

if item.IsASCII() {
    text, _ := item.ToASCII()
}
if item.IsList() {
    size := item.Size()
    nested, _ := item.Get(0)
}
if item.IsInt() {
    values, _ := item.ToInt()
}
```

### 10. Creating GEM Standard Messages (Go)

```go
// Using gem package for standard messages
s1f1 := gem.NewS1F1()  // Are You There
s1f13 := gem.NewS1F13(
    secs2.U4(100),
    secs2.L(
        secs2.U4(1001),
        secs2.A("VALUE"),
    ),
)

reply, err := session.SendDataMessage(
    s1f13.StreamCode(),
    s1f13.FunctionCode(),
    s1f13.WaitBit(),
    s1f13.Item(),
)
```

## 📖 Reference Documentation

### Documentation Sources

#### **documentation/** - Python secsgem Library Docs
- 250 pages of comprehensive ReadTheDocs content
- API reference for Python implementation
- Tutorial and usage examples
- Stream/Function message catalog
- **Best for**: Python developers, understanding GEM standard messages

#### **github/README.md** - go-secs Repository
- Go implementation overview
- Package structure (secs2, gem, hsms, hsmsss)
- Object hierarchy and interfaces
- Installation and basic usage
- **Best for**: Go developers, understanding architecture

#### **github/issues.md** - Known Issues
- Stack overflow with large messages (go-secs #6)
- Localized character string support (go-secs #4)
- Cross-language compatibility notes
- **Best for**: Troubleshooting, known limitations

### Language-Specific Implementations

| Language | Repository | Key Features |
|----------|-----------|--------------|
| **Python** | bparzella/secsgem | Most mature, full GEM support, 80 issues tracked |
| **Java** | ostigter/secs4j | Lightweight, surface analysis available |
| **.NET** | mkjeff/secs4net | C# implementation, surface analysis available |
| **Go** | arloliu/go-secs | Modern, concurrent, strong SML support |

## 🎯 Working with This Skill

### For Beginners
1. **Start with concepts**: Read Key Concepts section to understand SECS/GEM/HSMS
2. **Follow examples**: Use Quick Reference #1-3 for basic data item creation
3. **Use go-secs**: The Go implementation has clearest examples and documentation
4. **Reference**: Check `github/README.md` for complete usage patterns

### For Intermediate Users
1. **Message handlers**: Study Quick Reference #4 for handling different SxFy codes
2. **Connection modes**: Understand active vs passive using Quick Reference #5-6
3. **SML parsing**: Master text format for testing (Quick Reference #3, #8)
4. **Cross-reference**: Compare implementations when porting code

### For Advanced Users
1. **Protocol engineering**: Review SML document for custom message formats
2. **Performance**: Check github issues for large message handling
3. **Multi-session**: Explore session management beyond single-session examples
4. **Custom messages**: Implement non-standard equipment-specific SxFy patterns

### Navigation Tips
- **Need Python?** Start with documentation/ folder
- **Need Go?** Focus on github/README.md
- **Debugging?** Check github/issues.md for known problems
- **Protocol details?** Reference SEMI standards (E5, E37, E37.1)
- **Message patterns?** Search for specific SxFy codes in documentation

### Common Workflows

**Building an Equipment Simulator:**
1. Choose passive mode (equipment role)
2. Implement message handlers for required SxFy messages
3. Use SML for test message development
4. Reference Python secsgem for standard GEM messages

**Building a Host Application:**
1. Choose active mode (host role)
2. Send primary messages (odd function codes)
3. Handle replies (even function codes)
4. Implement timeout and retry logic

**Testing and Debugging:**
1. Use SML format for readable message definitions
2. Enable both connection endpoints in same codebase
3. Log message exchanges with ToSML()
4. Cross-reference behavior with standard

## 📚 Additional Resources

- **SEMI Standards**: Official E5 (SECS-II), E37 (HSMS), E37.1 (HSMS-SS) specifications
- **secsgem ReadTheDocs**: https://secsgem.readthedocs.io/en/latest/
- **go-secs GitHub**: https://github.com/arloliu/go-secs
- **SML Specification**: See go-secs sml/README.md for format details

---

*Generated by Skill Seeker's unified multi-source scraper*
