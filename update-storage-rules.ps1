$token = & gcloud auth print-access-token
$project = "dexprotector-saas-ian"

$rules = Get-Content "storage.rules" -Raw

$body = @{
    source = @{
        files = @(
            @{
                name = "storage.rules"
                content = $rules
            }
        )
    }
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "Updating Storage rules..."
$response = Invoke-RestMethod -Uri "https://firebaserules.googleapis.com/v1/projects/$project/releases" -Method Post -Headers $headers -Body $body

Write-Host "Storage rules updated successfully!"
$response | ConvertTo-Json -Depth 10
