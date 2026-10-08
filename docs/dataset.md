# Dataset Documentation — UNB NSL-KDD

## 1. Provenance & Official Source

- **Dataset Name**: NSL-KDD Network Intrusion Dataset
- **Issuing Institution**: Canadian Institute for Cybersecurity (CIC), University of New Brunswick (UNB), Canada
- **Official URL**: [https://www.unb.ca/cic/datasets/nsl.html](https://www.unb.ca/cic/datasets/nsl.html)
- **Primary Publication**:
  > M. Tavallaee, E. Bagheri, W. Lu, and A. Ghorbani, "A Detailed Analysis of the KDD CUP 99 Data Set," Submitted to Second IEEE Symposium on Computational Intelligence for Security and Defense Applications (CISDA), 2009.

---

## 2. Dataset Motivation & Justification

The original KDD'99 benchmark suffered from two widely acknowledged structural flaws:
1. **Redundant Records**: Approximately 78% of records were exact duplicates, skewing classifiers toward repeating connection patterns.
2. **Artificial Training/Testing Skew**: Duplicate entries in the test set produced artificially high accuracy scores that did not generalize to operational networks.

The **NSL-KDD** benchmark systematically addresses these limitations by:
- Removing duplicate records from both training and testing partitions.
- Balancing difficulty levels across diverse attack classes.
- Maintaining realistic proportions of clean versus malicious traffic.

---

## 3. Feature Catalog (41 Network Flow Dimensions)

The 41 features are categorized into four logical groups:

| Category | Features | Security Relevance |
|---|---|---|
| **Basic Connection Features** | `duration`, `protocol_type`, `service`, `flag`, `src_bytes`, `dst_bytes`, `land`, `wrong_fragment`, `urgent` | Detects abnormal packet volume, protocol mismatch, and fragment exploits. |
| **Content Features** | `hot`, `num_failed_logins`, `logged_in`, `num_compromised`, `root_shell`, `su_attempted`, `num_root`, `num_file_creations`, `num_shells`, `num_access_files`, `num_outbound_cmds`, `is_host_login`, `is_guest_login` | Detects unauthorized privilege escalation, repeated authentication failures, and shell spawning. |
| **Time-based Traffic Features** | `count`, `srv_count`, `serror_rate`, `srv_serror_rate`, `rerror_rate`, `srv_rerror_rate`, `same_srv_rate`, `diff_srv_rate`, `srv_diff_host_rate` | Tracks connection density in a 2-second sliding window, identifying rapid DoS and port scans. |
| **Host-based Traffic Features** | `dst_host_count`, `dst_host_srv_count`, `dst_host_same_srv_rate`, `dst_host_diff_srv_rate`, `dst_host_same_src_port_rate`, `dst_host_srv_diff_host_rate`, `dst_host_serror_rate`, `dst_host_srv_serror_rate`, `dst_host_rerror_rate`, `dst_host_srv_rerror_rate` | Analyzes historical destination host patterns across the last 100 connections to unmask slow stealth probes. |

---

## 4. Attack Classes & Category Taxonomy

| Super-Category | Threat Description | Specific Attack Signatures in Dataset |
|---|---|---|
| **Normal** | Legitimate user and system network traffic | `normal` |
| **DoS (Denial of Service)** | Flooding memory/bandwidth to crash services | `neptune`, `smurf`, `back`, `teardrop`, `pod`, `land`, `mailbomb`, `apache2`, `processtable`, `udpstorm` |
| **Probe (Surveillance)** | Scanning network topology and vulnerability mapping | `ipsweep`, `portsweep`, `nmap`, `satan`, `saint`, `mscan` |
| **R2L (Remote to Local)** | Gaining unauthorized local access via remote exploits | `warezclient`, `guess_passwd`, `warezmaster`, `imap`, `ftp_write`, `multihop`, `phf`, `spy`, `sendmail`, `named`, `snmpgetattack`, `snmpguess`, `worm`, `xlock`, `xsnoop` |
| **U2R (User to Root)** | Local unprivileged user elevating to root privileges | `buffer_overflow`, `loadmodule`, `rootkit`, `perl`, `sqlattack`, `xterm`, `ps` |
