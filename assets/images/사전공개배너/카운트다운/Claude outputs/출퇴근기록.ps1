# 출퇴근기록.ps1
# PC 켜짐/꺼짐, 절전/깨어남, 로그온/로그오프 이벤트로 날짜별 출퇴근 시간을 뽑습니다.
# 사용 예)  .\출퇴근기록.ps1                      → 올해 1월 1일 ~ 오늘
#          .\출퇴근기록.ps1 -Start 2026-10-01      → 10월 1일 ~ 오늘

param(
    [datetime]$Start = (Get-Date -Month 1 -Day 1).Date,
    [datetime]$End   = (Get-Date)
)

# 사용할 이벤트 (모두 '시스템' 로그)
#  Kernel-General 12 : 부팅(켜짐)        Kernel-General 13 : 종료(꺼짐)
#  Power-Troubleshooter 1 : 절전에서 깨어남   Kernel-Power 42 : 절전 진입
#  Winlogon 7001 : 로그온               Winlogon 7002 : 로그오프
$targets = @{
    'Microsoft-Windows-Kernel-General'       = 12, 13
    'Microsoft-Windows-Power-Troubleshooter' = 1
    'Microsoft-Windows-Kernel-Power'         = 42
    'Microsoft-Windows-Winlogon'             = 7001, 7002
}

$events = Get-WinEvent -FilterHashtable @{
    LogName   = 'System'
    StartTime = $Start
    EndTime   = $End
    Id        = 12, 13, 1, 42, 7001, 7002
} -ErrorAction SilentlyContinue | Where-Object {
    $targets.ContainsKey($_.ProviderName) -and ($targets[$_.ProviderName] -contains $_.Id)
}

if (-not $events) { Write-Host '해당 기간에 이벤트가 없습니다.'; return }

$result = $events |
    Group-Object { $_.TimeCreated.ToString('yyyy-MM-dd') } |
    Sort-Object Name |
    ForEach-Object {
        $times = $_.Group.TimeCreated | Sort-Object
        $in  = $times[0]
        $out = $times[-1]
        [pscustomobject]@{
            날짜     = $in.ToString('yyyy-MM-dd (ddd)')
            출근     = $in.ToString('HH:mm')
            퇴근     = $out.ToString('HH:mm')
            근무시간 = '{0:hh\:mm}' -f ($out - $in)
        }
    }

$result | Format-Table -AutoSize

$csv = Join-Path ([Environment]::GetFolderPath('Desktop')) ("출퇴근기록_{0:yyyyMMdd}.csv" -f (Get-Date))
$result | Export-Csv -Path $csv -NoTypeInformation -Encoding UTF8
Write-Host "CSV 저장: $csv"
