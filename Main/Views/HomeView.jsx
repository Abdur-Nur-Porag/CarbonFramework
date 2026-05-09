var HomeView=(
<PageView Name="HomeView" Initial="true">
  <App>
    <AppBar>
        
    </AppBar>

    <AppBody ScrollBar="true">
     <div>
  <CarbonDatePicker 
  Id="event_1" 
  Placeholder="Event Date" 
  Type="Border"
  
  >
</CarbonDatePicker>

  <CarbonTimePicker 
    Id="meeting_time" 
    Placeholder="Meeting Schedule (12H)" 
    Type="fill" 
    Format="12"
    Icon="Left"
    >
  </CarbonTimePicker>

  
  <CarbonTimePicker 
    Id="alarm_clock" 
    Placeholder="Set Alarm (24H)" 
    Type="Border" 
    Format="24">
  </CarbonTimePicker>
        <h3>Default Line</h3>
        <DividerBody>
            <DividerText>CONTINUE</DividerText>
        </DividerBody>

        <h3>Dashed Type</h3>
        <DividerBody type="dash">
            <DividerText>OR LOGIN WITH</DividerText>
        </DividerBody>

        <h3>Dotted Type</h3>
        <DividerBody type="dot">
            <DividerText>END OF SECTION</DividerText>
        </DividerBody>

<h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello</h1><h1>Hello Last</h1>
     </div>
     
    </AppBody>
    <BottomBar>
      <footer class="fill">
  <nav>
    <button class="circle transparent">
      <i>check_box</i>
    </button>
    <button class="circle transparent">
      <i>brush</i>
    </button>
    <button class="circle transparent">
      <i>mic</i>
    </button>
    <button class="circle transparent">
      <i>image</i>
    </button>
    <div class="max"></div>
    <button class="square round extra">
      <i>add</i>
    </button>
  </nav>
</footer>
    </BottomBar>
     <Fab name="MainFab">
        <FabBody>
            <FabItem>Create New <FabSpace></FabSpace> 📝</FabItem>
            <FabItem>Upload File <FabSpace></FabSpace> ☁️</FabItem>
            <FabItem>Settings <FabSpace></FabSpace> ⚙️</FabItem>
        </FabBody>
        <FabButton></FabButton>
    </Fab>
    
  </App>
    
</PageView>

<pageview Name="Dashboard">
  <App>
    <AppBar>
      <div style="padding: 15px; background: #333; color: #fff;">Dashboard</div>
    </AppBar>

    <AppBody type="vscroll" scrollbar="true">
      <div style="padding: 20px;">
        <h2 id="welcomeMsg">Loading...</h2>
        <p>This is your main app content. The scrollbar is smart!</p>
       
        <div style="height: 1000px; background: linear-gradient(to bottom, #fff, #ddd);"></div>
      </div>
    </AppBody>

    <BottomBar>
      <button onclick="openPageView('LoginPage')">Logout</button>
    </BottomBar>
  </App>
</pageview>
)